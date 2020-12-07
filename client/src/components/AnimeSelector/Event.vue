<!--suppress HtmlUnknownTarget -->
<template>
  <v-container>
    <autocomplete v-model="media" />
    <draggable v-model="media" handle=".handle">
      <v-row v-for="(m, index) in media" :key="index">
        <v-col cols="1">
          <v-icon class="handle">fas fa-bars</v-icon>
        </v-col>
        <v-col cols="11">
          <v-row>
            <v-chip>
              <v-avatar left>
                <img :src="m.image" :alt="m.title" />
              </v-avatar>
              {{ m.title }}
              <v-btn @click="value.splice(index, 1)" icon>
                <v-icon>fas fa-times-circle</v-icon>
              </v-btn>
            </v-chip>
          </v-row>
          <v-row>
            <v-range-slider
              :value="[
                m.EventMedia.episode,
                m.EventMedia.episode + m.EventMedia.episodes
              ]"
              @input="setEpisodes(m, $event)"
              :min="1"
              :max="m.episodes ? m.episodes + 1 : 31"
            >
              <template v-slot:prepend>
                <v-text-field
                  :value="m.EventMedia.episode"
                  class="mt-0 pt-0"
                  hide-details
                  single-line
                  type="number"
                  style="width: 60px"
                  @input="
                    setEpisodes(m, [
                      Number($event),
                      m.EventMedia.episode + m.EventMedia.episodes
                    ])
                  "
                ></v-text-field>
              </template>
              <template v-slot:append>
                <v-text-field
                  :value="m.EventMedia.episode + m.EventMedia.episodes - 1"
                  class="mt-0 pt-0"
                  hide-details
                  single-line
                  type="number"
                  style="width: 60px"
                  @input="
                    setEpisodes(m, [m.EventMedia.episode, Number($event) + 1])
                  "
                ></v-text-field>
              </template>
            </v-range-slider>
          </v-row>
        </v-col>
      </v-row>
    </draggable>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Media } from "@/types";
import draggable from "vuedraggable";
import Autocomplete from "@/components/AnimeSelector/Autocomplete.vue";

@Component({
  components: { Autocomplete, draggable }
})
export default class AnimeSelectorEvent extends Vue {
  @Prop() value!: Media[];

  get media() {
    return this.value;
  }

  set media(media: Media[]) {
    for (const m of media) {
      if (!m.EventMedia) {
        m.EventMedia = { episode: 1, episodes: 1, order: 0 };
      }
    }
    this.$emit("input", media);
  }

  setEpisodes(media: Media, event: number[]) {
    if (media.episodes && event[0] > media.episodes) {
      event[0] = media.episodes;
    } else if (!media.episodes && event[0] > 30) {
      event[0] = 30;
    }
    if (media.EventMedia) {
      if (media.EventMedia.episode !== event[0]) {
        if (media.EventMedia.episodes !== event[1] - media.EventMedia.episode) {
          media.EventMedia.episodes = event[1] - event[0];
        }
        media.EventMedia.episode = event[0];
      } else {
        media.EventMedia.episodes = event[1] - event[0];
        if (media.EventMedia.episodes <= 0) {
          media.EventMedia.episodes = 1;
        }
      }
      event[0] = media.EventMedia.episode;
      event[1] = media.EventMedia.episode + media.EventMedia.episodes;
    }
  }
}
</script>

<style scoped></style>
