<!--suppress HtmlUnknownTarget -->
<template>
  <v-container>
    <autocomplete v-model="series" />
    <draggable v-model="series" handle=".handle">
      <v-row v-for="(series, index) in eventseries" :key="index">
        <v-col cols="1">
          <v-icon class="handle">fas fa-bars</v-icon>
        </v-col>
        <v-col cols="11">
          <v-row>
            <v-chip>
              <v-avatar left>
                <img :src="series.details.image" :alt="series.details.title" />
              </v-avatar>
              {{ series.details.title }}
              <v-btn @click="eventseries.splice(index, 1)" icon>
                <v-icon>fas fa-times-circle</v-icon>
              </v-btn>
            </v-chip>
          </v-row>
          <v-row>
            <v-range-slider
              :value="[series.episode, series.episode + series.episodes]"
              @input="setEpisodes(series, $event)"
              :min="1"
              :max="series.details.episodes ? series.details.episodes + 1 : 31"
            >
              <template v-slot:prepend>
                <v-text-field
                  :value="series.episode"
                  class="mt-0 pt-0"
                  hide-details
                  single-line
                  type="number"
                  style="width: 60px"
                  @input="
                    setEpisodes(series, [
                      Number($event),
                      series.episode + series.episodes
                    ])
                  "
                ></v-text-field>
              </template>
              <template v-slot:append>
                <v-text-field
                  :value="series.episode + series.episodes - 1"
                  class="mt-0 pt-0"
                  hide-details
                  single-line
                  type="number"
                  style="width: 60px"
                  @input="
                    setEpisodes(series, [series.episode, Number($event) + 1])
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
import { EventSeries, Series } from "@/types";
import draggable from "vuedraggable";
import Autocomplete from "@/components/AnimeSelector/Autocomplete.vue";

@Component({
  components: { Autocomplete, draggable }
})
export default class AnimeSelectorEvent extends Vue {
  @Prop() value!: EventSeries[];

  get eventseries() {
    return this.value;
  }

  set eventseries(series: EventSeries[]) {
    this.$emit("input", series);
  }

  get series() {
    return (this.value as EventSeries[]).map((series: EventSeries) => {
      if (series.details) {
        return series.details;
      }
      return {} as Series;
    });
  }

  set series(series: Series[]) {
    // eslint-disable-next-line no-case-declarations
    const events: EventSeries[] = [];
    for (const s of series) {
      let event = this.value.find(v => v.details == s);
      if (!event) {
        event = {
          details: s,
          episode: 1,
          episodes: 1
        } as EventSeries;
      }
      events.push(event);
    }
    this.$emit("input", events);
  }

  setEpisodes(series: EventSeries, event: number[]) {
    if (
      series.details &&
      series.details.episodes &&
      event[0] > series.details.episodes
    ) {
      event[0] = series.details.episodes;
    } else if ((!series.details || !series.details.episodes) && event[0] > 30) {
      event[0] = 30;
    }
    if (series.episode !== event[0]) {
      if (series.episodes !== event[1] - series.episode) {
        series.episodes = event[1] - event[0];
      }
      series.episode = event[0];
    } else {
      series.episodes = event[1] - event[0];
      if (series.episodes <= 0) {
        series.episodes = 1;
      }
    }
  }
}
</script>

<style scoped></style>
