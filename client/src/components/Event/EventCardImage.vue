<!--suppress ALL -->
<template>
  <div>
    <!--suppress HtmlUnknownTarget -->
    <v-img
      v-if="image"
      :src="image"
      alt="event"
      class="white--text align-end event-image"
    />
    <div v-if="!image" :class="'img-wrap img-wrap-' + seriesImages.length">
      <img
        v-for="(value, index) in seriesImages"
        :key="index"
        :src="value"
        @click="gotoSeries(index)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { EventSeries } from "@/types";

@Component
export default class EventCardImage extends Vue {
  @Prop() series!: EventSeries[];
  @Prop() image!: string;
  @Prop() small!: boolean;

  get seriesImages() {
    return this.series.map(series => {
      if (!series.details) {
        return "";
      }
      return series.details.image;
    });
  }

  gotoSeries(index: number) {
    if (!this.small) {
      const url = this.series[index].details?.siteUrl;
      if (url) {
        const win = window.open(url, "_blank");
        if (win) {
          win.focus();
        }
      }
    }
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

  .img-wrap-5 {
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

      &:nth-of-type(5) {
        clip-path: polygon(
          25% $wrap-4-height-offset,
          75% $wrap-4-height-offset,
          100% 50%,
          75% ($wrap-heigth - $wrap-4-height-offset * 2.5),
          25% ($wrap-heigth - $wrap-4-height-offset * 2.5),
          0% 50%
        );
        left: $wrap-width / 4 - $wrap-4-width-offset;
        top: $wrap-heigth / 4 - $wrap-4-height-offset;
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

      &:nth-of-type(5):hover {
        clip-path: polygon(
                0% 0%,
                100% 0%,
                100% 50%,
                100% 100%,
                0% 100%,
                0% 50%
        );
        top: $wrap-heigth / 2 - $wrap-4-height / 2;
        left: $wrap-width / 2 - $wrap-4-width / 2;
      }
    }
  }

  .img-wrap-6 {
    $wrap-4-width: $img-width * 0.8;
    $wrap-4-height: $img-height * 0.8;
    $wrap-4-width-offset: ($wrap-4-width - $wrap-width / 2) / 2;
    $wrap-4-height-offset: ($wrap-4-height - $wrap-heigth / 3) / 2;

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
        top: $wrap-heigth / 3 - $wrap-4-height-offset;
      }

      &:nth-of-type(4) {
        left: $wrap-width / 2 - $wrap-4-width-offset;
        top: $wrap-heigth / 3 - $wrap-4-height-offset;
      }

      &:nth-of-type(5) {
        left: -$wrap-4-width-offset;
        top: $wrap-heigth / 3 * 2 - $wrap-4-height-offset;
      }

      &:nth-of-type(6) {
        left: $wrap-width / 2 - $wrap-4-width-offset;
        top: $wrap-heigth / 3 * 2 - $wrap-4-height-offset;
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
        top: ($wrap-heigth - $wrap-4-height) / 2;
        left: 0;
      }

      &:nth-of-type(4):hover {
        top: ($wrap-heigth - $wrap-4-height) / 2;
        left: $wrap-width - $wrap-4-width;
      }

      &:nth-of-type(5):hover {
        top: $wrap-heigth - $wrap-4-height;
        left: 0;
      }

      &:nth-of-type(6):hover {
        top: $wrap-heigth - $wrap-4-height;
        left: $wrap-width - $wrap-4-width;
      }
    }
  }
}

.event-image {
  max-width: 350px;
  max-height: 350px * 1.125;
}

@include image_mix();
@media (max-width: 816px) {
  @include image_mix($wrap-width: 150px);
  .event-image {
    max-width: 150px;
    max-height: 150px * 1.125;
  }
}
</style>
