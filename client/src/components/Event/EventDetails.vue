<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" max-width="600px">
    <template v-slot:activator="{ on }">
      <slot name="activator" :onClick="on.click" />
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">{{ event.title }}</span>
      </v-card-title>
      <v-card-text>{{ event.description }}</v-card-text>
      <v-tabs v-model="selected" center-active grow>
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
      <EventActions
        v-if="$store.getters.isLoggedIn"
        :event="event"
        :small="small"
      />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import axios, { CancelTokenSource } from "axios";
import EventActions from "@/components/Event/EventActions.vue";

@Component({ components: { EventActions } })
export default class EventDetails extends Vue {
  @Prop() event!: Event;
  @Prop() small?: boolean;
  dialog = false;
  selected = "";
}
</script>

<style lang="scss">
.v-slide-group__prev {
  display: none!important;
}
</style>
