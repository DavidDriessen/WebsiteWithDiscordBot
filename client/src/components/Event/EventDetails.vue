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
      <v-card-text>
        <v-label>Streamer:</v-label>
        <v-chip>
          <v-avatar left>
            <img :src="event.streamer.avatar" :alt="event.streamer.name" />
          </v-avatar>
          <span> {{ event.streamer.name }}</span>
        </v-chip>
        <br />
        {{ event.description }}
      </v-card-text>

      <v-expansion-panels popout hover>
        <v-expansion-panel v-for="media in event.media" :key="media.seriesId">
          <v-expansion-panel-header>
            <v-row>
              <v-col cols="8" sm="10">
                {{ media.title }}
              </v-col>
              <v-col cols="4" sm="2">
                <b>
                  Ep {{ media.EventMedia.episode
                  }}{{
                    media.EventMedia.episodes > 1
                      ? "-" +
                        (media.EventMedia.episode +
                          media.EventMedia.episode -
                          1)
                      : ""
                  }}
                </b>
              </v-col>
            </v-row>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <v-col cols="3">
                <v-img :src="media.image" />
              </v-col>
              <v-col cols="9">
                <v-card-subtitle v-html="media.description" />
              </v-col>
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <EventActions v-if="isLoggedIn && !history" :event="event" />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import EventActions from "@/components/Event/EventActions.vue";
import { mapGetters } from "vuex";

@Component({
  components: { EventActions },
  computed: { ...mapGetters(["isLoggedIn"]) }
})
export default class EventDetails extends Vue {
  @Prop() event!: Event;
  @Prop() small?: boolean;
  @Prop() history!: boolean;
  dialog = false;
  selected = "";
}
</script>
