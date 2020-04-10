<!--suppress ALL -->
<template>
  <v-card :width="width" style="margin-bottom: 40px" hover>
    <!--suppress HtmlUnknownTarget -->
    <v-img
      v-if="event.image"
      :src="event.image"
      alt="event"
      class="white--text align-end"
      max-width="300"
      max-height="350"
    >
    </v-img>
    <div
      v-if="!event.image"
      :class="'img-wrap img-wrap-' + event.series.length"
    >
      <img
        v-for="(value, index) in seriesImages"
        :key="index"
        :src="value"
        @click="gotoSeries(index)"
      />
    </div>
    <v-card-title :style="'font-size: ' + titleFontSize + 'px;'">
      {{ event.title }}
    </v-card-title>
    <v-card-subtitle>{{ time }}</v-card-subtitle>
    <v-card-actions class="justify-center">
      <v-btn-toggle v-if="$store.getters.isAdmin" group>
        <EventModal :event-to-edit="event" :small="small" />
        <v-btn color="gray" :x-small="small" icon>
          <v-icon>fas fa-clone</v-icon>
        </v-btn>
      </v-btn-toggle>
      <v-spacer v-if="$store.getters.isAdmin" />
      <event-details :event="event" :small="small" />
      <v-spacer />
      <EventStream :event="event" :small="small" :streaming="streaming" />
      <v-btn-toggle
        v-if="$store.getters.isLoggedIn && !event.roomcode && !streaming"
        v-model="attending"
        group
      >
        <v-btn :value="1" :x-small="small" icon>
          <v-icon color="green">fas fa-check-circle</v-icon>
        </v-btn>
        <v-btn :value="0" :x-small="small" icon>
          <v-icon color="red">fas fa-times-circle</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import axios, { CancelTokenSource } from "axios";
import EventDetails from "@/components/EventDetails.vue";
import EventModal from "@/components/EventModal.vue";
import { Event } from "@/types";
import moment from "moment";
import EventStream from "@/components/EventStream.vue";

@Component({ components: { EventStream, EventDetails, EventModal } })
export default class EventCard extends Vue {
  @Prop() event!: Event;
  @Prop() width!: number;
  dialog = false;
  time = "";

  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 60000);
  }

  updateTime() {
    if (this.event.start < moment() && moment() < this.event.end)
      this.time = "Now";
    else if (moment().dayOfYear() + 1 > this.event.start.dayOfYear())
      this.time = this.event.start.fromNow();
    else if (moment().dayOfYear() + 7 > this.event.start.dayOfYear())
      this.time =
        this.event.start.format("dddd h:mma - ") +
        this.event.end.format("h:mma");
    else
      this.time =
        this.event.start.format("ddd, D MMM h:mma - ") +
        this.event.end.format("h:mma");
  }

  gotoSeries(index: number) {
    const url = this.event.series[index].details?.siteUrl;
    if (url) {
      const win = window.open(url, "_blank");
      if (win) win.focus();
    }
  }

  get titleFontSize() {
    if (this.small) {
      if (this.event.title.length < 10) return 20;
      if (this.event.title.length <= 16) return 28 - this.event.title.length;
      if (this.event.title.length < 20) return 29 - this.event.title.length;
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
      if (!series.details) return "";
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

  get seriesImages() {
    return this.event.series.map(series => {
      if (!series.details) return "";
      return series.details.coverImage.extraLarge;
    });
  }

  get attending() {
    if (this.event.attending) return this.event.attending.decision;
    return -1;
  }

  set attending(state) {
    if (!isNaN(state))
      this.$store.dispatch("setAttending", { event: this.event, state });
  }

  get streaming() {
    if (this.event.streamer && this.$store.state.user)
      return this.event.streamer.id == this.$store.state.user.id;
    return false;
  }
}
</script>

<style lang="scss">
@mixin image_mix($wrap-width: 350px) {
  $wrap-heigth: $wrap-width * 1.125;
  $img-width: $wrap-width * 0.8;
  $img-height: $wrap-heigth;
  .img-wrap {
    width: $wrap-width;
    height: $wrap-heigth;
    position: relative;

    img {
      width: $img-width;
      height: $img-height;
      position: absolute;
      z-index: 0;
      transition: all 0.2s ease 0.2s;
    }
  }

  .img-wrap-1 {
    img {
      left: ($wrap-width - $img-width) / 2;
    }
  }
  .img-wrap-2 {
    $wrap-2-width-offset: ($img-width - $wrap-width / 2) / 2;

    img {
      clip-path: inset(0 $wrap-2-width-offset - 1px 0 $wrap-2-width-offset);

      &:nth-of-type(1) {
        left: -$wrap-2-width-offset;
      }

      &:nth-of-type(2) {
        left: $wrap-width / 2 - $wrap-2-width-offset - 1px;
      }

      &:hover {
        clip-path: inset(0 00% 0 0);
        z-index: 1;
      }

      &:nth-of-type(1):hover {
        left: 0;
      }

      &:nth-of-type(2):hover {
        left: $wrap-width - $img-width;
      }
    }
  }

  .img-wrap-3 {
    $wrap-3-width-offset: ($img-width - $wrap-width / 3) / 2;

    img {
      clip-path: inset(0 $wrap-3-width-offset 0 $wrap-3-width-offset);

      &:nth-of-type(1) {
        left: -$wrap-3-width-offset;
      }

      &:nth-of-type(2) {
        left: $wrap-width/2 - $img-width/2;
      }

      &:nth-of-type(3) {
        left: $wrap-width - $img-width + $wrap-3-width-offset;
      }

      &:hover {
        clip-path: inset(0 0 0 0);
        z-index: 1;
      }

      &:nth-of-type(1):hover {
        left: 0;
      }

      &:nth-of-type(3):hover {
        left: $wrap-width - $img-width;
      }
    }
  }

  .img-wrap-4 {
    $wrap-4-width: $img-width * 0.8;
    $wrap-4-height: $img-height * 0.8;
    $wrap-4-width-offset: ($wrap-4-width - $wrap-width / 2) / 2;
    $wrap-4-height-offset: ($wrap-4-height - $wrap-heigth / 2) / 2;

    img {
      clip-path: inset(
        $wrap-4-height-offset $wrap-4-width-offset $wrap-4-height-offset
          $wrap-4-width-offset
      );
      width: $wrap-4-width;
      height: $wrap-4-height;

      &:nth-of-type(1) {
        left: -$wrap-4-width-offset;
        top: -$wrap-4-height-offset;
      }

      &:nth-of-type(2) {
        left: $wrap-width / 2 - $wrap-4-width-offset;
        top: -$wrap-4-height-offset;
      }

      &:nth-of-type(3) {
        left: -$wrap-4-width-offset;
        top: $wrap-heigth / 2 - $wrap-4-height-offset;
      }

      &:nth-of-type(4) {
        left: $wrap-width / 2 - $wrap-4-width-offset;
        top: $wrap-heigth / 2 - $wrap-4-height-offset;
      }

      &:hover {
        clip-path: inset(0 0 0 0);
        z-index: 1;
      }

      &:nth-of-type(1):hover {
        top: 0;
        left: 0;
      }

      &:nth-of-type(2):hover {
        top: 0;
        left: $wrap-width - $wrap-4-width;
      }

      &:nth-of-type(3):hover {
        top: $wrap-heigth - $wrap-4-height;
        left: 0;
      }

      &:nth-of-type(4):hover {
        top: $wrap-heigth - $wrap-4-height;
        left: $wrap-width - $wrap-4-width;
      }
    }
  }
}
@include image_mix();
@media (max-width: 816px) {
  @include image_mix($wrap-width: 150px);
}
</style>
