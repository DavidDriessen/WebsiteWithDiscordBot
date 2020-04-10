<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn color="gray" icon v-on="on" :x-small="small">
        <v-icon>fas fa-info-circle</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">{{ event.title }}</span>
      </v-card-title>
      <v-card-text> </v-card-text>
      <v-tabs v-model="selected">
        <v-tab v-for="eventSeries in event.series" :key="eventSeries.seriesId">
          {{ eventSeries.details.title.english }}
        </v-tab>
      </v-tabs>
      <v-tabs-items v-model="selected">
        <v-tab-item
          v-for="eventSeries in event.series"
          :key="eventSeries.seriesId"
        >
          <v-container>
            <v-row>
              <v-col cols="3">
                <v-img :src="eventSeries.details.coverImage.extraLarge" />
              </v-col>
              <v-col cols="9">
                <v-card-subtitle v-html="eventSeries.details.description" />
              </v-col>
            </v-row>
          </v-container>
        </v-tab-item>
      </v-tabs-items>
      <v-card-actions v-if="$store.getters.isLoggedIn">
        <v-spacer />
        <v-btn color="green" icon>
          <v-icon>fas fa-check-circle</v-icon>
        </v-btn>
        <v-btn color="red" text>
          <v-icon>fas fa-times-circle</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import axios, { CancelTokenSource } from "axios";

@Component
export default class EventDetails extends Vue {
  @Prop() event!: Event;
  @Prop() small?: boolean;
  dialog = false;
  selected = "";
}
</script>

<style lang="scss"></style>
