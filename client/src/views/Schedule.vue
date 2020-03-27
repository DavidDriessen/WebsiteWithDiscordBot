<template>
  <v-container fluid class="schedule">
    <v-row
      v-for="(chunkEvent, chunkIndex) of chunkedEvents"
      :key="chunkIndex"
      justify="space-around"
    >
      <v-card
        v-for="(event, index) of chunkEvent"
        :key="index"
        width="300"
        style="margin-bottom: 20px"
      >
        <!--suppress HtmlUnknownTarget -->
        <v-img
          :src="event.img"
          alt="event"
          class="white--text align-end"
          max-width="300"
          max-height="300"
        >
          <v-card-title>{{ event.title }}</v-card-title>
        </v-img>
        <v-card-text>
          {{ event.description }}
        </v-card-text>
        <v-card-actions v-if="$store.getters.isLoggedIn">
          <EventModal v-if="$store.getters.isAdmin" :event-to-edit="event" />
          <v-btn v-if="$store.getters.isAdmin" color="gray" icon>
            <v-icon>fas fa-clone</v-icon>
          </v-btn>
          <v-spacer />
          <v-btn color="green" icon>
            <v-icon>fas fa-check-circle</v-icon>
          </v-btn>
          <v-btn color="red" text>
            <v-icon>fas fa-times-circle</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import EventModal from '@/components/EventModal.vue';

  interface Event {
  title: string;
  description: string;
  img: string;
}

@Component({
  components: { EventModal }
})
export default class Home extends Vue {
  events: Event[] = [
    { title: "Title", description: "Description", img: "/img/plunderer.jpg" },
    { title: "Title", description: "Description", img: "/img/plunderer.jpg" },
    { title: "Title", description: "Description", img: "/img/plunderer.jpg" },
    { title: "Title", description: "Description", img: "/img/plunderer.jpg" },
    { title: "Title", description: "Description", img: "/img/plunderer.jpg" },
    { title: "Title", description: "Description", img: "" }
  ];

  get chunkedEvents() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("chunk")(this.events, 3);
  }
}
</script>

<style lang="scss"></style>
