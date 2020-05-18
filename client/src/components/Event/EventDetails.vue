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

      <v-expansion-panels popout hover>
        <v-expansion-panel
          v-for="eventSeries in event.series"
          :key="eventSeries.seriesId"
        >
          <v-expansion-panel-header>
            <v-row>
              <v-col cols="8" sm="10">
                {{ eventSeries.details.title.english }}
              </v-col>
              <v-col cols="4" sm="2">
                <b>
                  Ep {{ eventSeries.episode
                  }}{{
                    eventSeries.episodes > 1
                      ? "-" + (eventSeries.episode + eventSeries.episode - 1)
                      : ""
                  }}
                </b>
              </v-col>
            </v-row>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <v-col cols="3">
                <v-img :src="eventSeries.details.coverImage.extraLarge" />
              </v-col>
              <v-col cols="9">
                <v-card-subtitle v-html="eventSeries.details.description" />
              </v-col>
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <EventActions
        v-if="$store.getters.isLoggedIn && !history"
        :event="event"
      />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import EventActions from "@/components/Event/EventActions.vue";

@Component({ components: { EventActions } })
export default class EventDetails extends Vue {
  @Prop() event!: Event;
  @Prop() small?: boolean;
  @Prop() history!: boolean;
  dialog = false;
  selected = "";
}
</script>
