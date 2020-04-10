<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" :persistent="streaming" max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn v-if="streaming" color="success" v-on="on" :x-small="small">
        Stream
      </v-btn>
      <v-btn
        v-if="!streaming && roomcode"
        color="success"
        :x-small="small"
        v-on="on"
      >
        Join
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-form ref="form" lazy-validation @submit="save">
          <v-row>
            <v-col cols="12">
              <v-text-field
                label="Roomcode"
                v-model="roomcode"
                :rules="[
                  v => !!v || 'Roomcode is required',
                  v =>
                    (v && v.startWith('room-')) ||
                    'Title must be less than 25 characters'
                ]"
                :disabled="!streaming"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions v-if="streaming">
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
import { Event, Series, EventSeries, User } from "@/types";
import moment from "moment";

@Component
export default class EventStream extends Vue {
  @Prop() event!: Event;
  @Prop() small?: boolean;
  @Prop() streaming!: boolean;
  dialog = false;

  get roomcode() {
    return this.event.roomcode;
  }
  set roomcode(code) {
    this.event.roomcode = code;
  }

  close() {
    this.dialog = false;
    this.$refs.form.resetValidation();
  }

  save() {
    this.$refs.form.validate();
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
