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
import axios from "../../plugins/axios";

@Component({
  components: { draggable }
})
export default class AnimeImporter extends Vue {
  @Prop() value!: Media[];
  loading = false;
  search = "";
  items: Media[] = [];
  typingTimer: number | null = null;

  update(media: Media[]) {
    this.$emit("input", media);
  }

  @Watch("search")
  getAniBdMedia(search: string, previousSearch: string, isTyping = true) {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    if (isTyping) {
      this.typingTimer = setTimeout(() => {
        this.getAniBdMedia(search, previousSearch, false);
      }, 1000);
    } else if (search) {
      this.loading = true;
      axios
        .post(
          "https://anilist-graphql.p.rapidapi.com/",
          {
            query:
              "query ($search: String) { Page{ media(search: $search, type: ANIME){ " +
              "id\n                    idMal\n                    title { english romaji  userPreferred }\n                    description\n                    synonyms\n                    siteUrl\n                    status\n                    season\n                    duration\n                    genres\n                    trailer { site }\n                    episodes\n                    coverImage { extraLarge large medium }" +
              " }}}",
            variables: { search: search }
          },
          {
            headers: {
              "content-type": "application/json",
              "x-rapidapi-host": "anilist-graphql.p.rapidapi.com",
              "x-rapidapi-key":
                "7312ba6a87mshd90faca3bd5b364p160c8bjsn42e2ef6a0aa4",
              accept: "application/json"
            }
          }
        )
        .then(r => r.data.data.Page.media)
        .then(media => {
          this.items = media.map(
            (m: {
              title: {
                english: string;
                romaji: string;
                userPreferred: string;
              };
              description: string;
              coverImage: { extraLarge: string };
              genres: string;
              duration: string;
              episodes: string;
              id: string;
              siteUrl: string;
              idMal: string;
            }) => ({
              title: m.title.english || m.title.romaji || m.title.userPreferred,
              description: m.description,
              image: m.coverImage.extraLarge,
              genres: m.genres,
              duration: m.duration,
              episodes: m.episodes,
              references: [
                {
                  name:
                    m.title.english || m.title.romaji || m.title.userPreferred,
                  type: "anidb",
                  apiId: m.id,
                  url: m.siteUrl
                },
                {
                  name:
                    m.title.english || m.title.romaji || m.title.userPreferred,
                  type: "mal",
                  apiId: m.idMal,
                  url: ""
                }
              ],
              trailer: "",
              type: ""
            })
          );
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
      search ||
      media.title.toLowerCase().search(search.toLowerCase()) >= 0 ||
      media.description.toLowerCase().search(search.toLowerCase()) >= 0
    );
  }
}
</script>

<style scoped></style>
