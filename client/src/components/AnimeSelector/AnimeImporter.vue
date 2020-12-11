<!--suppress HtmlUnknownTarget -->
<template>
  <v-autocomplete
    :value.sync="value"
    @input="update"
    :items.sync="items"
    :loading="loading"
    :search-input.sync="search"
    label="Import from API"
    :item-value="seriesItemValue"
    auto-select-first
    hide-details
    hide-no-data
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
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Media, MediaReference } from "@/types";
import draggable from "vuedraggable";
import axios from "../../plugins/axios";

@Component({
  components: { draggable }
})
export default class AnimeImporter extends Vue {
  @Prop() value!: Media[];
  @Prop() apiName!: string;
  loading = false;
  search = "";
  items: Media[] = [];
  typingTimer: number | null = null;
  refs: MediaReference[] = [];

  update(media: Media) {
    this.loading = true;
    axios
      .put("/api/media", media, {
        headers: localStorage.token
          ? {
              Authorization: `Bearer ${localStorage.token}`
            }
          : {}
      })
      .then(r => r.data)
      .then((media: Media) => {
        const ref = media.references.find(r => r.type === this.apiName);
        if (ref) {
          this.items.splice(
            this.items.findIndex(m => m.references[0].apiId === ref.apiId)
          );
        }
        this.refs = this.refs.concat(media.references);
        this.$emit("input", media);
        this.loading = false;
      });
  }

  mounted() {
    this.getRefs();
  }

  getRefs() {
    axios
      .get("/api/media/refs/" + this.apiName)
      .then(r => r.data)
      .then(refs => {
        this.refs = refs;
      });
  }

  @Watch("search")
  getAniBdMedia(search: string, previousSearch: string, isTyping = true) {
    interface APIMedia {
      title: {
        english: string;
        romaji: string;
        userPreferred: string;
      };
      description: string;
      coverImage: { extraLarge: string };
      genres: string[];
      duration: number;
      episodes: number;
      id: number;
      siteUrl: string;
      idMal: string;
    }

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
              "id\nidMal\ntitle { english romaji  userPreferred }\ndescription\nsynonyms\nsiteUrl\nstatus\nseason\nduration\ngenres\ntrailer { site }\nepisodes\ncoverImage { extraLarge large medium }" +
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
        .then((m: APIMedia[]) =>
          m.filter(m => !this.refs.some(r => r.apiId === m.id.toString()))
        )
        .then((media: APIMedia[]) => {
          this.items = media.map((m: APIMedia) => ({
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
                apiId: m.id.toString(),
                url: m.siteUrl
              },
              m.idMal
                ? {
                    name:
                      m.title.english ||
                      m.title.romaji ||
                      m.title.userPreferred,
                    type: "mal",
                    apiId: m.idMal.toString(),
                    url: ""
                  }
                : ((undefined as unknown) as MediaReference)
            ],
            trailer: "",
            type: ""
          }));
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }

  seriesItemValue(v: Media) {
    return v;
  }

  // customFilter(media: Media, search: string) {
  customFilter() {
    return true;
    // return (
    //   search ||
    //   media.title.toLowerCase().search(search.toLowerCase()) >= 0 ||
    //   media.description.toLowerCase().search(search.toLowerCase()) >= 0
    // );
  }
}
</script>

<style scoped></style>
