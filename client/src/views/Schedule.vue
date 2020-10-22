<template>
  <v-container fluid v-resize="onResize">
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="128">
        <h1>Loading</h1>
      </v-progress-circular>
    </v-overlay>

    <v-data-iterator
      :items="events"
      :disable-pagination="events.length < 6"
      :hide-default-footer="events.length < 6"
    >
      <template v-slot:header>
        <v-toolbar
          flat
          style="padding-right: 50px; padding-top: 10px; border-radius: 10px; background: transparent"
        >
          <v-spacer />
          <v-switch v-model="ampm" label="12hr" style="margin-right: 20px" />
          <v-switch v-model="history" label="History" @change="getSchedule" />
        </v-toolbar>
        <v-divider />
      </template>
      <template v-slot:default="{ items }">
        <v-row justify="space-around" style="padding: 20px">
          <event-card
            v-for="(event, index) of items"
            :key="index"
            :event.sync="event"
            :width.sync="Math.floor(width / 400) > 1 ? 350 : 150"
            :history="history"
            :ampm.sync="ampm"
            @save="getSchedule"
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
              No event are currently planned
            </v-card-title>
            <v-card-text>
              Check back later.
              <br />
              Or check the <router-link to="/polls">polls</router-link> page for
              possible polls for next season.
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
    <EventModal v-if="isAdmin" @save="getSchedule" />
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Event, EventSeries, Series } from "@/types";
import EventModal from "@/components/Event/EventModal.vue";
import EventCard from "@/components/Event/EventCard.vue";
import { mapPreferences } from "vue-preferences";
import AnimeCache from "@/store/animeCache";
import axios from "../plugins/axios";
import moment from "moment";
import { mapGetters } from "vuex";

@Component({
  components: { EventCard, EventModal },
  computed: {
    ...mapPreferences({ ampm: { defaultValue: true } }),
    ...mapGetters(["isLoggedIn", "isAdmin"])
  }
})
export default class Schedule extends Vue {
  ampm!: boolean;
  events: Event[] = [];
  seriesCache: {
    [k: number]: Series;
  } = [];
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
    this.events = [];
    axios
      .get("/api/schedule", {
        headers: localStorage.token
          ? {
              Authorization: `Bearer ${localStorage.token}`
            }
          : {},
        params: { history: this.history ? "true" : undefined }
      })
      .then(async response => {
        const events: Event[] = response.data;
        for (const event of events) {
          if (event) {
            event.start = moment(event.start);
            event.end = moment(event.end);
            const series: EventSeries[] | undefined = event.series;
            if (series) {
              for (let i = 0; i < series.length; i++) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                series[i].details = AnimeCache.getSeries(series[i].seriesId);
              }
            }
          }
        }
        await AnimeCache.fetch();
        this.events = events;
        this.loading = false;
      });
  }

  get chunkedEvents() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("chunk")(this.events, this.chunkSize);
  }
}
</script>

<style lang="scss"></style>
