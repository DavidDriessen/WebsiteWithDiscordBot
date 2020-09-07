<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn
        v-if="!eventToEdit && !eventToClone"
        fixed
        dark
        fab
        bottom
        right
        color="primary"
        v-on="on"
      >
        <v-icon>fas fa-plus</v-icon>
      </v-btn>
      <v-list-item v-if="eventToEdit" v-on="on">
        <v-list-item-icon>
          <v-icon color="gray">fas fa-pencil-alt</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Edit event</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="eventToClone && !next" v-on="on">
        <v-list-item-icon>
          <v-icon color="gray">fas fa-clone</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Clone event</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="eventToClone && next" v-on="on">
        <v-list-item-icon>
          <v-icon color="gray">fas fa-clone</v-icon>
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
          <v-tab>Streamer</v-tab>
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
                    v-model="event.streamer"
                    :items.sync="streamers"
                    label="Streamer"
                    item-text="name"
                    :item-value="itemValue"
                    auto-select-first
                    hide-selected
                    chips
                    :rules="[v => !!v || 'Streamer is required']"
                  >
                    <template v-slot:selection="{ item }">
                      <v-chip>
                        <v-avatar left>
                          <img :src="item.avatar" :alt="item.name" />
                        </v-avatar>
                        <span> {{ item.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="{ item }">
                      <v-avatar>
                        <img :src="item.avatar" :alt="item.name" />
                      </v-avatar>
                      <span> {{ item.name }}</span>
                    </template>
                  </v-autocomplete>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>
          <v-tab-item>
            <v-card-text>
              <anime-selector v-model="event.series" />
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
import axios from "../../plugins/axios";
import { Event, Series, EventSeries, User } from "@/types";
import draggable from "vuedraggable";
import moment from "moment";
import { cloneDeep } from "lodash";
import AnimeSelector from "@/components/AnimeSelector/Event.vue";

@Component({
  components: { AnimeSelector, draggable }
})
export default class EventModal extends Vue {
  @Prop() eventToEdit?: Event;
  @Prop() eventToClone?: Event;
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
  streamers: User[] = [];
  tab = "details";

  mounted() {
    this.getStreamers();
    if (this.eventToClone) {
      this.clone();
    }
    if (this.eventToEdit) {
      this.event = this.eventToEdit;
    }
  }

  itemValue(user: User) {
    return user;
  }

  getStreamers() {
    axios
      .get("/api/user/streamers", {
        headers: {
          Authorization: `Bearer ${localStorage.token}`
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        useCache: true
      })
      .then((response: { data: User[] }) => {
        this.streamers = response.data;
      })
      .catch((error: object) => {
        console.log(error);
      });
  }

  clone() {
    if (this.eventToClone) {
      this.event = cloneDeep(this.eventToClone);
      this.event.start = this.eventToClone.start.clone();
      this.event.end = this.eventToClone.end.clone();
      if (this.next) {
        this.event.start.add(1, "week");
        this.event.end.add(1, "week");
        this.event.series = this.event.series.filter(
          series =>
            !(
              series.details &&
              series.details.episodes &&
              series.episode + series.episodes > series.details.episodes
            )
        );
        for (const series of this.event.series) {
          series.episode = series.episode + series.episodes;
          if (series.details && series.details.episodes) {
            if (series.episode + series.episodes - 1 > series.details.episodes) {
              series.episodes = series.details.episodes - series.episode + 1;
            }
          }
        }
      }
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
    this.$emit("close");
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
            this.$emit("save");
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
            this.$emit("save");
          });
      }
    }
  }
}
</script>

<style lang="scss"></style>
