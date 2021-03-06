<template>
  <v-container v-resize="onResize">
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="128">
        <h1>Loading</h1>
      </v-progress-circular>
    </v-overlay>
    <v-data-iterator :items="polls" disable-pagination hide-default-footer>
      <template v-slot:header>
        <v-toolbar
          flat
          style="padding-right: 50px; padding-top: 10px; border-radius: 10px; background: transparent"
        >
          <v-spacer />
          <!--      <v-switch v-model="ampm" label="12hr" style="margin-right: 20px" />-->
          <v-switch
            v-model="history"
            label="History"
            @change="getPolls"
            v-if="isAdmin"
          />
        </v-toolbar>
        <v-divider />
      </template>
      <template v-slot:default="{ items }">
        <v-row justify="space-around" style="padding: 20px">
          <poll-card
            v-for="(poll, index) of items"
            :key="index"
            :cols="3 / 12"
            :poll.sync="poll"
            :width="400"
            :history="history"
            :ampm.sync="ampm"
            @save="getPolls"
            @notLoggedin="loginNotice = true"
          />
        </v-row>
      </template>
      <template v-slot:no-data>
        <v-row justify="space-around" style="padding: 20px">
          <v-card width="400" style="margin-bottom: 40px" hover>
            <v-card-title
              class="text-truncate text-no-wrap"
              :style="'display: block; font-size: 16px;'"
            >
              No polls available
            </v-card-title>
            <v-card-text>
              There are currently no polls going on.
              <br />
              Check back later.
            </v-card-text>
            <v-card-subtitle>
              <small>
                Polls happen around the beginning of an anime season.
              </small>
            </v-card-subtitle>
          </v-card>
        </v-row>
      </template>
    </v-data-iterator>
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
import { Poll } from "@/types";
import PollCard from "@/components/Poll/PollCard.vue";
import { mapPreferences } from "vue-preferences";
import axios from "@/plugins/axios";
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
      .get("/api/polls", {
        params: { history: this.history ? "true" : undefined }
      })
      .then(async response => {
        const polls: Poll[] = response.data;
        for (const poll of polls) {
          if (poll) {
            poll.end = moment(poll.end);
          }
        }
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
