<!--suppress HtmlUnknownTarget -->
<template>
  <v-container>
    <autocomplete :value="media" @input="update" />
    <v-btn @click="other">Add other</v-btn>
    <draggable v-model="options" handle=".handle">
      <v-row v-for="(item, index) in value" :key="index">
        <v-col cols="1">
          <v-icon class="handle" style="margin-top: 5px">fas fa-bars</v-icon>
        </v-col>
        <v-col cols="11">
          <v-row>
            <v-chip v-if="item.media">
              <v-avatar left>
                <img :src="item.media.image" :alt="item.media.title" />
              </v-avatar>
              {{ item.media.title }}
              <v-btn @click="value.splice(index, 1)" icon>
                <v-icon>fas fa-times-circle</v-icon>
              </v-btn>
            </v-chip>
            <v-chip v-if="!item.media">
              <v-text-field v-model="item.content" dense />
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
import { Media, PollOption } from "@/types";
import draggable from "vuedraggable";
import Autocomplete from "@/components/AnimeSelector/Autocomplete.vue";

@Component({
  components: { Autocomplete, draggable }
})
export default class AnimeSelectorPoll extends Vue {
  @Prop() value!: PollOption[];
  media = [];

  get options() {
    return this.value;
  }

  set options(options: PollOption[]) {
    this.$emit("input", options);
  }

  update(media: Media[]) {
    this.media.splice(0, this.media.length);
    const newValue = this.value;
    newValue.push({ content: "", media: media[0] } as PollOption);
    this.$emit("input", newValue);
  }

  other() {
    const newValue = this.value;
    newValue.push({ content: "" } as PollOption);
    this.$emit("input", newValue);
  }
}
</script>

<style scoped></style>
