<template>
  <v-autocomplete
    v-model="series"
    :items.sync="items"
    :loading="loading"
    :search-input.sync="search"
    label="Series"
    :item-text="seriesItemText"
    :item-value="seriesItemValue"
    auto-select-first
    hide-details
    hide-no-data
  >
    <template v-slot:selection="{ item }">
      <div v-if="item.title">
        <v-avatar size="32">
          <img :src="item.coverImage.medium" :alt="item.title.english" />
        </v-avatar>
        <span>
          {{ item.title.english ? item.title.english : item.title.romaji }}
        </span>
      </div>
    </template>
    <template v-slot:item="{ item }">
      <div v-if="item.title">
        <v-avatar>
          <img :src="item.coverImage.medium" :alt="item.title.english" />
        </v-avatar>
        <span>
          {{ item.title.english ? item.title.english : item.title.romaji }}
        </span>
      </div>
    </template>
  </v-autocomplete>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Series } from "@/types";
import AnimeCache from "@/store/animeCache";

@Component
export default class AutocompleteAnime extends Vue {
  @Prop() value!: Series | number;
  series: Series = {} as Series;
  loading = false;
  search = "";
  items: Series[] = [];
  typingTimer: number | null = null;

  mounted() {
    if (typeof this.value == "object") {
      this.series = this.value;
    } else if (this.value) {
      this.series = AnimeCache.getSeries(this.value);
    }
    this.items = AnimeCache.getList();
  }

  @Watch("search")
  getSeries(search: string, previousSearch: string, isTyping = true) {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    if (isTyping) {
      this.typingTimer = setTimeout(() => {
        this.getSeries(search, previousSearch, false);
      }, 1000);
    } else if (search) {
      this.loading = true;
      AnimeCache.search(search)
        .then((series: void | Series[]) => {
          this.items = series as Series[];
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }

  seriesItemText(v: Series) {
    if (v.title) {
      return (
        v.title.english +
        " " +
        v.title.romaji +
        " " +
        v.title.userPreferred +
        " " +
        v.description
      );
    }
    return "";
  }

  seriesItemValue(v: Series) {
    return v;
  }

  @Watch("series")
  update() {
    // if (typeof this.value == "object") {
    this.$emit("input", this.series);
    // } else {
    //   this.$emit("input", this.series.id);
    // }
  }
}
</script>

<style scoped></style>
