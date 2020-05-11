<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn
        v-if="!eventToEdit && !eventToClone"
        color="primary"
        dark
        v-on="on"
        :x-small="small"
      >
        Add event
      </v-btn>
      <v-list-item v-if="eventToEdit" v-on="on">
        <v-list-item-icon>
          <v-icon :x-small="small" color="gray">fas fa-pencil-alt</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Edit event</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="eventToClone && !next" v-on="on">
        <v-list-item-icon>
          <v-icon :x-small="small" color="gray">fas fa-clone</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Clone event</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="eventToClone && next" v-on="on">
        <v-list-item-icon>
          <v-icon :x-small="small" color="gray">fas fa-clone</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Clone next</v-list-item-title>
      </v-list-item>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline" v-if="!eventToEdit && !eventToClone">
          New event
        </span>
        <span class="headline" v-if="eventToEdit">Edit event</span>
        <span class="headline" v-if="eventToClone">Cloning event</span>
      </v-card-title>
      <v-form ref="form" lazy-validation @submit="save()">
        <v-tabs v-model="tab">
          <v-tab>Details</v-tab>
          <v-tab>Series</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="12" md="6">
                  <v-text-field
                    label="Title"
                    v-model="event.title"
                    :rules="[
                      v => !!v || 'Title is required',
                      v =>
                        (v && v.length <= 150) ||
                        'Title must be less than 150 characters'
                    ]"
                  />
                </v-col>
                <v-col cols="12" sm="12" md="3">
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
                <v-col cols="12" sm="12" md="3">
                  <v-datetime-picker
                    label="End"
                    v-model="end"
                    :text-field-props="{
                      rules: [
                        v => !!v || 'Start is required',
                        v =>
                          event.start < event.end || 'End must be after start'
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
                <v-col cols="12">
                  <v-textarea label="Description" v-model="event.description" />
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>
          <v-tab-item>
            <v-card-text>
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
              <v-container>
                <draggable v-model="event.series" handle=".handle">
                  <v-row v-for="(series, index) in event.series" :key="index">
                    <v-col cols="1">
                      <v-icon class="handle">fas fa-bars</v-icon>
                    </v-col>
                    <v-col cols="11">
                      <v-row>
                        <v-chip>
                          <v-avatar left>
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
                      </v-row>
                      <v-row>
                        <v-range-slider
                          :value="[
                            series.episode,
                            series.episode + series.episodes
                          ]"
                          @input="setEpisodes(series, $event)"
                          :min="1"
                          :max="
                            series.details.episodes
                              ? series.details.episodes + 1
                              : 31
                          "
                        >
                          <template v-slot:prepend>
                            <v-text-field
                              :value="series.episode"
                              class="mt-0 pt-0"
                              hide-details
                              single-line
                              type="number"
                              style="width: 60px"
                              @input="
                                setEpisodes(series, [
                                  Number($event),
                                  series.episode + series.episodes
                                ])
                              "
                            ></v-text-field>
                          </template>
                          <template v-slot:append>
                            <v-text-field
                              :value="series.episode + series.episodes - 1"
                              class="mt-0 pt-0"
                              hide-details
                              single-line
                              type="number"
                              style="width: 60px"
                              @input="
                                setEpisodes(series, [
                                  series.episode,
                                  Number($event) + 1
                                ])
                              "
                            ></v-text-field>
                          </template>
                        </v-range-slider>
                      </v-row>
                    </v-col>
                  </v-row>
                </draggable>
              </v-container>
            </v-card-text>
          </v-tab-item>
        </v-tabs-items>
      </v-form>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close()" :loading="loading"
          >Close
        </v-btn>
        <v-btn color="blue darken-1" text @click="save()" :loading="loading"
          >Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import axios from "axios";
import { Event, Series, EventSeries } from "@/types";
import draggable from "vuedraggable";
import moment from "moment";
import cloneDeep from "lodash-ts/cloneDeep";

@Component({
  components: { draggable }
})
export default class EventModal extends Vue {
  @Prop() eventToEdit?: Event;
  @Prop() eventToClone?: Event;
  @Prop() small?: boolean;
  @Prop() next!: boolean;
  dialog = false;
  event: Event = {
    id: 0,
    title: "",
    series: [],
    start: moment(),
    end: moment()
  } as Event;
  loading = false;
  loadingSeries = false;
  search = "";
  items: Series[] = [];
  typingTimer: number | null = null;
  tab = "details";

  mounted() {
    if (this.eventToClone) {
      this.clone();
    }
    if (this.eventToEdit) {
      this.event = this.eventToEdit;
    }
  }

  @Watch("search")
  getSeries(search: string, previousSearch: string, isTyping = true) {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
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

  clone() {
    if (this.eventToClone) {
      this.event = cloneDeep(this.eventToClone);
      this.event.start = this.eventToClone.start.clone();
      this.event.end = this.eventToClone.end.clone();
      if (this.next) {
        this.event.start.add(1, "week");
        this.event.end.add(1, "week");
        for (const series of this.event.series) {
          if (series.details && series.details.episodes) {
            if (series.episode + 1 > series.details.episodes) {
              this.event.series.splice(this.event.series.indexOf(series), 1);
            }
            if (series.episode + series.episodes > series.details.episodes) {
              series.episode = series.details.episodes;
            } else {
              series.episode = series.episode + series.episodes;
            }
          } else {
            series.episode = series.episode + series.episodes;
          }
        }
      }
    }
  }

  seriesItemValue(v: Series) {
    return v;
  }

  setEpisodes(series: EventSeries, event: number[]) {
    if (
      series.details &&
      series.details.episodes &&
      event[0] > series.details.episodes
    ) {
      event[0] = series.details.episodes;
    } else if ((!series.details || !series.details.episodes) && event[0] > 30) {
      event[0] = 30;
    }
    if (series.episode !== event[0]) {
      if (series.episodes !== event[1] - series.episode) {
        series.episodes = event[1] - event[0];
      }
      series.episode = event[0];
    } else {
      series.episodes = event[1] - event[0];
      if (series.episodes <= 0) {
        series.episodes = 1;
      }
    }
  }

  get series() {
    if (this.event.series) {
      return this.event.series.map((series: EventSeries) => {
        if (series.details) {
          return series.details;
        }
        return {} as Series;
      });
    }
    return [];
  }

  set series(series: Series[]) {
    for (let i = this.event.series.length; i < series.length; i++) {
      this.event.series.push({
        details: series[i],
        episode: 1,
        episodes: 1
      } as EventSeries);
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
    } else if (this.eventToClone) {
      this.clone();
    } else {
      this.form.reset();
      this.event.series = [];
    }
  }

  save() {
    if (this.form.validate()) {
      this.loading = true;
      if (this.eventToEdit) {
        axios
          .post("/api/schedule", this.event, {
            headers: {
              Authorization: `Bearer ${localStorage.token}`
            }
          })
          .then(() => {
            this.close();
            this.loading = false;
          });
      } else {
        axios
          .put("/api/schedule", this.event, {
            headers: {
              Authorization: `Bearer ${localStorage.token}`
            }
          })
          .then(() => {
            this.close();
            this.loading = false;
          });
      }
    }
  }
}
</script>

<style lang="scss"></style>
