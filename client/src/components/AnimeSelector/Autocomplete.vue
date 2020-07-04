<!--suppress HtmlUnknownTarget -->
<template>
  <v-container>
    <v-autocomplete
      :value="value"
      @input="update"
      :items.sync="items"
      :loading="loading"
      :search-input.sync="search"
      label="Series"
      :item-text="seriesItemText"
      :item-value="seriesItemValue"
      auto-select-first
      hide-selected
      hide-details
      hide-no-data
      multiple
    >
      <template v-slot:selection="{}" />
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
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Series } from "@/types";
import AnimeCache from "@/store/animeCache";
import draggable from "vuedraggable";

@Component({
  components: { draggable }
})
export default class Autocomplete extends Vue {
  @Prop() value!: Series[];
  loading = false;
  search = "";
  items: Series[] = [];
  typingTimer: number | null = null;

  mounted() {
    this.items = AnimeCache.getList();
  }

  update(series: Series[]) {
    this.$emit("input", series);
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
}
</script>

<style scoped></style>
