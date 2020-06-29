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
      <event-card
        v-for="(event, index) of chunkEvent"
        :key="index"
        :cols="chunkEvent / 12"
        :event.sync="event"
        :width.sync="Math.floor(width / 400) > 1 ? 350 : 150"
        :history="history"
        :ampm.sync="ampm"
        @save="getSchedule"
      />
    </v-row>
    <EventModal v-if="isAdmin" />
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Event, EventSeries, Series } from "@/types";
import EventModal from "@/components/Event/EventModal.vue";
import EventCard from "@/components/Event/EventCard.vue";
import { mapPreferences } from "vue-preferences";
import { AxiosResponse } from "axios";
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
      .get(
        "/api/schedule" + (this.history ? "?history=true" : ""),
        localStorage.token
          ? {
              headers: {
                Authorization: `Bearer ${localStorage.token}`
              }
            }
          : {}
      )
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
                series[i].details = this.getSeries(series[i].seriesId);
              }
            }
          }
        }
        await this.fetchSeries();
        this.events = events;
        this.loading = false;
      });
  }

  getSeries(id: number) {
    if (!this.seriesCache[id]) {
      this.seriesCache[id] = {} as Series;
    }
    return this.seriesCache[id];
  }

  fetchSeries() {
    return axios
      .get("/api/series/get", {
        params: { ids: Object.keys(this.seriesCache) },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        useCache: true
      })
      .then((response: AxiosResponse) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const series: Series[] = response.data;
        for (let i = 0; i < series.length; i++) {
          this.seriesCache[series[i].id].id = series[i].id;
          this.seriesCache[series[i].id].title = series[i].title;
          this.seriesCache[series[i].id].description = series[i].description;
          this.seriesCache[series[i].id].coverImage = series[i].coverImage;
          this.seriesCache[series[i].id].episodes = series[i].episodes;
          this.seriesCache[series[i].id].siteUrl = series[i].siteUrl;
        }
        return series;
      });
  }

  get chunkedEvents() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("chunk")(this.events, this.chunkSize);
  }
}
</script>

<style lang="scss"></style>
