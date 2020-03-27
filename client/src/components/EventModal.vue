<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn v-if="!eventToEdit" color="primary" dark v-on="on">
        Add event
      </v-btn>
      <v-btn v-if="eventToEdit" color="gray" icon v-on="on">
        <v-icon>fas fa-pencil-alt</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">New event</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12" sm="12" md="6">
              <v-text-field label="Title" v-model="event.title"></v-text-field>
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
                v-model="event.start"
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
                v-model="event.end"
              ></v-datetime-picker>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="12">
              <v-autocomplete
                v-model="event.seasons"
                :items="seasons"
                label="Series"
                item-text="title"
                item-value="id"
                auto-select-first
                deletable-chips
                hide-selected
                multiple
                chips
              ></v-autocomplete
            ></v-col>
          </v-row>
          <v-row>
            <v-col></v-col>
          </v-row>
        </v-container>
        <small>*indicates required field</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="dialog = false">Close</v-btn>
        <v-btn color="blue darken-1" text @click="save()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import axios from 'axios';

  interface Event {
  title: string | null;
  description: string | null;
  seasons: number[];
  img: string | File;
  start: Date;
  end: Date;
}

@Component
export default class EventModal extends Vue {
  @Prop() eventToEdit?: Event;
  dialog = false;
  event: Event = {} as Event;
  seasons = [{ id: 1, title: "Test" }];

  mounted() {
    if (this.eventToEdit) this.event = this.eventToEdit;
  }

  getSeasons() {
    axios.get("/api/series/seasons").then(response => {
      this.seasons = response.data;
    });
  }

  save() {
    axios.put("/api/schedule", this.event);
  }
}
</script>

<style lang="scss"></style>
