<!--suppress HtmlUnknownTarget -->
<template>
  <v-container>
    <v-autocomplete
      :value.sync="value"
      @input="update"
      :items.sync="items"
      :loading="loading"
      :search-input.sync="search"
      label="Series"
      :item-value="seriesItemValue"
      auto-select-first
      hide-selected
      hide-details
      hide-no-data
      multiple
      :filter="customFilter"
    >
      <template v-slot:selection="{}" />
      <template v-slot:item="{ item }">
        <div v-if="item.title">
          <v-avatar>
            <img :src="item.image" :alt="item.title" />
          </v-avatar>
          <span>{{ item.title }}</span>
        </div>
      </template>
    </v-autocomplete>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Media } from "@/types";
import draggable from "vuedraggable";
import axios from "@/plugins/axios";

@Component({
  components: { draggable }
})
export default class Autocomplete extends Vue {
  @Prop() value!: Media[];
  loading = false;
  search = "";
  items: Media[] = [];

  update(media: Media[]) {
    this.$emit("input", media);
  }

  @Watch("search")
  getMedia(search: string) {
    if (search) {
      this.loading = true;
      axios
        .get("/api/media/search/" + encodeURIComponent(search))
        .then(r => r.data)
        .then((media: Media[]) => {
          for (const m of media) {
            if (!this.items.some(i => i.id === m.id)) {
              this.items.push(m);
            }
          }
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }

  seriesItemValue(v: Media) {
    return v;
  }

  customFilter(media: Media, search: string) {
    return (
      media.title.toLowerCase().search(search.toLowerCase()) >= 0 ||
      media.description.toLowerCase().search(search.toLowerCase()) >= 0
    );
  }
}
</script>

<style scoped></style>
