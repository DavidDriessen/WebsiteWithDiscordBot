<template>
  <v-container fluid v-resize="onResize">
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="128">
        <h1>Loading</h1>
      </v-progress-circular>
    </v-overlay>
    <v-row style="padding-right: 100px">
      <v-spacer />
      <!--      <v-switch v-model="ampm" label="12hr" style="margin-right: 20px" />-->
      <!--      <v-switch v-model="history" label="History" @change="getPolls" />-->
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
        :width="400"
        :history="history"
        :ampm.sync="ampm"
        @save="getPolls"
        @notLoggedin="loginNotice = true"
      />
    </v-row>
    <poll-modal v-if="isAdmin" @save="getPolls" />
    <v-snackbar v-model="loginNotice" :timeout="3000">
      <p class="text-center" style="width: 100%">
        Please login to perform that action.
      </p>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Poll, PollOptionType } from "@/types";
import PollCard from "@/components/Poll/PollCard.vue";
import { mapPreferences } from "vue-preferences";
import AnimeCache from "@/store/animeCache";
import axios from "../plugins/axios";
import moment from "moment";
import PollModal from "@/components/Poll/PollModal.vue";
import { mapGetters } from "vuex";

@Component({
  components: { PollModal, PollCard },
  computed: {
    ...mapPreferences({ ampm: { defaultValue: true } }),
    ...mapGetters(["isLoggedIn", "isAdmin"])
  }
})
export default class Polls extends Vue {
  loginNotice = false;
  ampm!: boolean;
  polls: Poll[] = [];
  loading = false;
  chunkSize = 3;
  width = 400;
  history = false;
  intervals: { update: number } = { update: 0 };

  mounted() {
    this.getPolls();
    this.onResize();
    this.intervals.update = setInterval(this.getPolls, 1000 * 60 * 60);
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

  getPolls() {
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
                if (option.type == PollOptionType.Series) {
                  option.content = AnimeCache.getSeries(Number(option.content));
                }
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
