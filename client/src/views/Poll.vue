<template>
  <v-container fluid v-resize="onResize">
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="128">
        <h1>Loading</h1>
      </v-progress-circular>
    </v-overlay>
    <v-row style="padding-right: 100px">
      <v-spacer />
      <v-switch v-model="ampm" label="12hr" style="margin-right: 20px" />
      <v-switch v-model="history" label="History" @change="getSchedule" />
    </v-row>
    <v-divider />
    <v-row
      v-for="(chunkEvent, chunkIndex) of chunkedEvents"
      :key="chunkIndex"
      justify="space-around"
      style="padding: 20px"
    >
      <poll-card
        v-for="(poll, index) of chunkEvent"
        :key="index"
        :cols="chunkEvent / 12"
        :poll.sync="poll"
        :width.sync="Math.floor(width / 400) > 1 ? 350 : 150"
        :history="history"
        :ampm.sync="ampm"
        @save="getSchedule"
      />
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Poll, PollOption, PollOptionType, Series } from "@/types";
import PollCard from "@/components/Poll/PollCard.vue";
import { mapPreferences } from "vue-preferences";
import AnimeCache from "@/store/animeCache";
import axios from "../plugins/axios";
import moment from "moment";

@Component({
  components: { PollCard },
  computed: {
    ...mapPreferences({ ampm: { defaultValue: true } })
  }
})
export default class Polls extends Vue {
  ampm!: boolean;
  polls: Poll[] = [];
  loading = false;
  chunkSize = 3;
  width = 350;
  history = false;
  intervals: { update: number } = { update: 0 };

  mounted() {
    this.getSchedule();
    this.onResize();
    this.intervals.update = setInterval(this.getSchedule, 1000 * 60 * 60);
  }

  beforeDestroy() {
    clearInterval(this.intervals.update);
  }

  onResize() {
    this.width = document.documentElement.clientWidth;
    this.chunkSize = Math.floor(this.width / 420);
    if (this.chunkSize == 1) {
      this.chunkSize = Math.floor(this.width / 160);
    }
  }

  getSchedule() {
    this.loading = true;
    this.polls = [];
    axios
      .get(
        "/api/polls" + (this.history ? "?history=true" : ""),
        localStorage.token
          ? {
              headers: {
                Authorization: `Bearer ${localStorage.token}`
              }
            }
          : {}
      )
      .then(async response => {
        const polls: Poll[] = response.data;
        for (const poll of polls) {
          if (poll) {
            poll.end = moment(poll.end);
            if (poll.options) {
              for (const option of poll.options) {
                if (option.type == PollOptionType.Series)
                  option.content = AnimeCache.getSeries(Number(option.content));
              }
            }
          }
        }
        await AnimeCache.fetch();
        this.polls = polls;
        this.loading = false;
      });
  }

  get chunkedEvents() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("chunk")(this.polls, this.chunkSize);
  }
}
</script>

<style lang="scss"></style>
