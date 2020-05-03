<!--suppress ALL -->
<template>
  <v-menu
    v-model="menu"
    :disabled="!$store.getters.isAdmin"
    absolute
    close-on-click
  >
    <template v-slot:activator="{ on }">
      <event-details :event="event" :small="small">
        <template v-slot:activator="{ onClick }">
          <v-card
            :width="width"
            style="margin-bottom: 40px"
            hover
            @contextmenu.prevent="on.click"
            @click="onClick"
          >
            <EventCardImage :image="event.image" :series="event.series" />
            <v-icon class="info-icon">fas fa-info-circle</v-icon>
            <v-card-title :style="'font-size: ' + titleFontSize + 'px;'">
              {{ event.title }}
            </v-card-title>
            <v-card-subtitle>{{ time }}</v-card-subtitle>
            <EventActions
              v-if="$store.getters.isLoggedIn"
              :event="event"
              :small="small"
            />
          </v-card>
        </template>
      </event-details>
    </template>

    <v-list>
      <EventModal :event-to-edit="event" :small="small" />
      <EventModal :event-to-clone="event" :small="small" />
      <EventModal :event-to-clone="event" :small="small" :next="true" />
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import axios, { CancelTokenSource } from "axios";
import EventDetails from "@/components/Event/EventDetails.vue";
import EventModal from "@/components/Event/EventModal.vue";
import { Event } from "@/types";
import moment from "moment";
import EventActions from "@/components/Event/EventActions.vue";
import EventCardImage from "@/components/Event/EventCardImage.vue";

@Component({
  components: { EventCardImage, EventActions, EventDetails, EventModal }
})
export default class EventCard extends Vue {
  @Prop() event!: Event;
  @Prop() width!: number;
  dialog = false;
  menu = false;
  time = "";

  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 60000);
  }

  updateTime() {
    if (this.event.start < moment() && moment() < this.event.end) {
      this.time = "Now";
    } else if (moment().dayOfYear() + 1 > this.event.start.dayOfYear()) {
      this.time = this.event.start.fromNow();
    } else if (moment().dayOfYear() + 7 > this.event.start.dayOfYear()) {
      this.time =
        this.event.start.format("dddd h:mma - ") +
        this.event.end.format("h:mma");
    } else {
      this.time =
        this.event.start.format("ddd, D MMM h:mma - ") +
        this.event.end.format("h:mma");
    }
  }

  get titleFontSize() {
    if (this.small) {
      if (this.event.title.length < 10) {
        return 20;
      }
      if (this.event.title.length <= 16) {
        return 28 - this.event.title.length;
      }
      if (this.event.title.length < 20) {
        return 29 - this.event.title.length;
      }
      return 9;
    } else {
      return 20;
    }
  }

  get small() {
    return this.width < 300;
  }

  get seriesTitles() {
    return this.event.series.map(series => {
      if (!series.details) {
        return "";
      }
      return (
        series.details.title.english +
        " #" +
        series.episode +
        (series.episodes > 1
          ? "-" + (series.episode + series.episodes - 1)
          : "")
      );
    });
  }
}
</script>

<style lang="scss">
.info-icon {
  position: absolute !important;
  right: 20px;
  margin-top: 30px;
}
</style>
