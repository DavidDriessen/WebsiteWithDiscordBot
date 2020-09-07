<!--suppress ALL -->
<template>
  <v-card-actions class="justify-center">
    <v-dialog v-model="dialog" :persistent="event.streaming" max-width="600px">
      <template v-slot:activator="{ on }">
        <v-btn v-if="event.streaming" color="success" v-on="on">
          Stream
        </v-btn>
        <div @click.stop v-if="!event.streaming">
          <v-btn v-if="roomcode" color="success" v-on="on">
            Join
          </v-btn>
          <v-btn-toggle v-if="!roomcode" v-model="attending" group>
            <v-btn :value="1" icon>
              <v-icon color="green">fas fa-check-circle</v-icon>
            </v-btn>
            <v-btn :value="0" icon>
              <v-icon color="red">fas fa-times-circle</v-icon>
            </v-btn>
            <v-btn :value="2" icon>
              <v-icon color="gray">fas fa-question-circle</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>
      </template>
      <v-card>
        <v-card-text>
          <v-form ref="form" lazy-validation @submit="save">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  label="Roomcode"
                  v-model.trim="roomcode"
                  :rules="[
                    v => !!v || 'Roomcode is required',
                    v =>
                      (v && v.startsWith('room-')) ||
                      'Roomcode must start with \'room-\'.',
                    v =>
                      (v && v.length === 13) ||
                      'Roomcode must be 13 characters long.'
                  ]"
                  :disabled="!event.streaming"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-chip
                v-for="attendee in event.attendees"
                :key="attendee.name"
                :color="decisionColor(attendee)"
              >
                <v-avatar left>
                  <v-img :src="attendee.avatar" />
                </v-avatar>
                {{ attendee.name }}
              </v-chip>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions v-if="event.streaming">
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="close()">Close</v-btn>
          <v-btn color="blue darken-1" text @click="save()">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card-actions>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import axios from "axios";
import { Event } from "@/types";

@Component
export default class EventActions extends Vue {
  @Prop() event!: Event;
  dialog = false;

  get roomcode() {
    return this.event.roomcode;
  }

  set roomcode(code) {
    this.event.roomcode = code;
  }

  get attending() {
    if (this.event.attending !== undefined) {
      return this.event.attending;
    }
    return -1;
  }

  set attending(state) {
    if (!isNaN(state)) {
      this.$store.dispatch("setAttending", { event: this.event, state });
    }
  }

  decisionColor(attendee: { Attendee: number | undefined }) {
    switch (attendee.Attendee) {
      case 1:
        return "success";
      case 2:
        return "warning";
      default:
        return "red";
    }
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
    this.form.resetValidation();
  }

  save() {
    this.form.validate();
    axios
      .post(
        "/api/schedule/streaming",
        { event: this.event.id, code: this.roomcode },
        {
          headers: {
            Authorization: `Bearer ${localStorage.token}`
          }
        }
      )
      .then(() => {
        this.dialog = false;
      });
  }
}
</script>

<style lang="scss"></style>
