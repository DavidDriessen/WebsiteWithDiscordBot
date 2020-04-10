<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn
        v-if="!eventToEdit"
        color="primary"
        dark
        v-on="on"
        :x-small="small"
      >
        Add event
      </v-btn>
      <v-btn v-if="eventToEdit" color="gray" icon v-on="on" :x-small="small">
        <v-icon>fas fa-pencil-alt</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">New event</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" lazy-validation @submit="save()">
          <v-row>
            <v-col cols="12" sm="12" md="6">
              <v-text-field
                label="Title"
                v-model="event.title"
                :rules="[
                  v => !!v || 'Title is required',
                  v =>
                    (v && v.length <= 25) ||
                    'Title must be less than 25 characters'
                ]"
              />
            </v-col>
            <v-col cols="12" sm="12" md="6">
              <v-textarea
                label="Description"
                v-model="event.description"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="12" md="6">
              <v-datetime-picker
                label="Start"
                v-model="start"
                :text-field-props="{
                  rules: [v => !!v || 'Start is required']
                }"
              >
                <template v-slot:dateIcon>
                  <v-icon>fas fa-calendar-alt</v-icon>
                </template>
                <template v-slot:timeIcon>
                  <v-icon>fas fa-clock</v-icon>
                </template>
              </v-datetime-picker>
            </v-col>
            <v-col cols="12" sm="12" md="6">
              <v-datetime-picker
                label="End"
                v-model="end"
                :text-field-props="{
                  rules: [
                    v => !!v || 'Start is required',
                    v => event.start < event.end || 'End must be after start'
                  ]
                }"
              >
                <template v-slot:dateIcon>
                  <v-icon>fas fa-calendar-alt</v-icon>
                </template>
                <template v-slot:timeIcon>
                  <v-icon>fas fa-clock</v-icon>
                </template>
              </v-datetime-picker>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="12">
              <v-autocomplete
                v-model="series"
                :items.sync="items"
                :loading="loadingSeries"
                :search-input.sync="search"
                label="Series"
                item-text="title.english"
                :item-value="seriesItemValue"
                auto-select-first
                hide-selected
                hide-details
                hide-no-data
                cache-items
                multiple
              >
                <template
                  v-slot:selection="
                    // eslint-disable-next-line vue/no-unused-vars
                    data
                  "
                />
                <template v-slot:item="data">
                  <v-avatar>
                    <img
                      :src="data.item.coverImage.medium"
                      :alt="data.item.title.english"
                  /></v-avatar>
                  <span> {{ data.item.title.english }}</span>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>
          <draggable handle=".handle">
            <v-row v-for="(series, index) in event.series" :key="index">
              <v-col cols="1">
                <v-icon class="handle">fas fa-bars</v-icon>
              </v-col>
              <v-col cols="6">
                <v-chip>
                  <v-avatar>
                    <img
                      :src="series.details.coverImage.medium"
                      :alt="series.details.title.english"
                    />
                  </v-avatar>
                  {{ series.details.title.english }}
                  <v-btn @click="event.series.splice(index, 1)" icon>
                    <v-icon>fas fa-times-circle</v-icon>
                  </v-btn>
                </v-chip>
              </v-col>
              <v-col cols="5">
                <v-range-slider
                  :value="[series.episode, series.episodes]"
                  @input="setEpisodes(series, $event)"
                  :min="1"
                  :max="series.details.episodes ? series.details.episodes : 12"
                  thumb-label="always"
                />
              </v-col>
            </v-row>
          </draggable>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close()">Close</v-btn>
        <v-btn color="blue darken-1" text @click="save()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import axios, { CancelTokenSource } from "axios";
import { Event, Series, EventSeries } from "@/types";
import draggable from "vuedraggable";
import moment from "moment";
import { ComponentOptions } from "vue/types/options";

@Component({
  components: { draggable }
})
export default class EventModal extends Vue {
  @Prop() eventToEdit?: Event;
  @Prop() small?: boolean;
  dialog = false;
  event: Event = {
    id: 0,
    title: "",
    series: [],
    start: moment(),
    end: moment()
  } as Event;
  loadingSeries = false;
  search = "";
  items: Series[] = [];
  typingTimer: number | null = null;

  mounted() {
    if (this.eventToEdit) this.event = this.eventToEdit;
  }

  @Watch("search")
  getSeries(search: string, previousSearch: string, isTyping = true) {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    if (isTyping) {
      this.typingTimer = setTimeout(() => {
        this.getSeries(search, previousSearch, false);
      }, 1000);
    } else if (search) {
      this.loadingSeries = true;
      axios
        .get("/api/series/search/" + encodeURIComponent(search))
        .then(response => {
          this.items = response.data.media;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.loadingSeries = false;
        });
    }
  }

  seriesItemValue(v: Series) {
    return v;
  }

  setEpisodes(series: EventSeries, event: any) {
    series.episode = event[0];
    series.episodes = event[1];
  }

  moveSeries(from: number, to: number) {
    this.event.series.splice(to, 0, this.event.series.splice(from, 1)[0]);
  }

  get series() {
    if (this.event.series)
      return this.event.series.map((series: EventSeries) => {
        if (series.details) return series.details;
        return {} as Series;
      });
    return [];
  }

  set series(series: Series[]) {
    for (let i = this.event.series.length; i < series.length; i++) {
      this.event.series.push({ details: series[i] } as EventSeries);
    }
  }

  get start() {
    return this.event.start.toDate();
  }

  set start(date) {
    this.form.resetValidation();
    this.event.start = moment(date);
  }

  get end() {
    return this.event.end.toDate();
  }

  set end(date) {
    this.form.resetValidation();
    this.event.end = moment(date);
  }

  get form() {
    return (this.$refs.form as unknown) as {
      reset(): void;
      resetValidation(): void;
      validate(): boolean;
    };
  }

  close() {
    this.dialog = false;
    if (this.eventToEdit) {
      this.form.resetValidation();
    } else {
      this.form.reset();
      this.event.series = [];
    }
  }

  save() {
    if (this.form.validate()) {
      if (this.eventToEdit) {
        axios
          .post("/api/schedule", this.event, {
            headers: {
              Authorization: `Bearer ${localStorage.token}`
            }
          })
          .then(() => {
            this.dialog = false;
          });
      } else {
        axios
          .put("/api/schedule", this.event, {
            headers: {
              Authorization: `Bearer ${localStorage.token}`
            }
          })
          .then(() => {
            this.dialog = false;
          });
      }
    }
  }
}
</script>

<style lang="scss"></style>
