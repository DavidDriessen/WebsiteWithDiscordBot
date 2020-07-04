<!--suppress HtmlUnknownTarget -->
<template>
  <v-container>
    <autocomplete v-model="series" />
    <draggable v-model="series" handle=".handle">
      <v-row v-for="(item, index) in series" :key="index">
        <v-col cols="1"> <v-icon class="handle">fas fa-bars</v-icon> </v-col>
        <v-col cols="11">
          <v-row>
            <v-chip>
              <v-avatar left>
                <img :src="item.coverImage.medium" :alt="item.title.english" />
              </v-avatar>
              {{ item.title.english ? item.title.english : item.title.romaji }}
              <v-btn @click="value.splice(index, 1)" icon>
                <v-icon>fas fa-times-circle</v-icon>
              </v-btn>
            </v-chip>
          </v-row>
        </v-col>
      </v-row>
    </draggable>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { PollOption, PollOptionType, Series } from "@/types";
import draggable from "vuedraggable";
import Autocomplete from "@/components/AnimeSelector/Autocomplete.vue";

@Component({
  components: { Autocomplete, draggable }
})
export default class AnimeSelectorPoll extends Vue {
  @Prop() value!: PollOption[];

  get series() {
    return (this.value as PollOption[])
      .filter((series: PollOption) => series.type === PollOptionType.Series)
      .map((series: PollOption) => {
        return series.content as Series;
      });
  }

  set series(series: Series[]) {
    // eslint-disable-next-line no-case-declarations
    const polls: PollOption[] = this.value.filter(
      v => v.type != PollOptionType.Series
    );
    const seriesOptions = this.value.filter(
      v => v.type == PollOptionType.Series
    );
    for (const s of series) {
      let poll = seriesOptions.find(v => (v.content as Series) == s);
      if (!poll) {
        poll = {
          type: PollOptionType.Series,
          content: s
        } as PollOption;
      }
      polls.push(poll);
    }
    this.$emit("input", polls);
  }
}
</script>

<style scoped></style>
