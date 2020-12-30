<template>
  <v-container v-resize="onResize">
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="128">
        <h1>Loading</h1>
      </v-progress-circular>
    </v-overlay>
    <v-data-iterator :items="medias" disable-pagination hide-default-footer>
      <template v-slot:header>
        <v-toolbar
          flat
          style="padding-right: 50px; padding-top: 10px; border-radius: 10px; background: transparent"
        >
          <v-col cols="5">
            <v-text-field label="Search" v-model="search" />
          </v-col>
          <v-col></v-col>
          <v-col cols="3">
            <anime-importer v-if="isAdmin" api-name="anidb" @input="addMedia" />
          </v-col>
        </v-toolbar>
        <v-divider />
      </template>
      <template v-slot:default="{ items }">
        <v-row justify="space-around" style="padding: 20px">
          <media-card
              v-for="(media, index) of items"
              :key="index" :media.sync="media"
              :width.sync="Math.floor(width / 400) > 1 ? 350 : 150"
              :height.sync="Math.floor(width / 400) > 1 ? 450 : 200"
          />
        </v-row>
        <v-row class="justify-center">
          <mugen-scroll
            :handler="getNext"
            :should-handle="!endPage && !loading"
          >
            <v-progress-circular
              indeterminate
              size="128"
              v-show="!endPage && loading"
            >
              <h1>Loading</h1>
            </v-progress-circular>
          </mugen-scroll>
        </v-row>
      </template>
    </v-data-iterator>
    <v-btn v-if="isAdmin" fixed fab bottom right color="primary" to="/media/0">
      <v-icon>fas fa-plus</v-icon>
    </v-btn>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { Media } from "@/types";
import { mapPreferences } from "vue-preferences";
import axios from "@/plugins/axios";
import { mapGetters } from "vuex";
import MediaCard from "@/components/Media/MediaCard.vue";
import AnimeImporter from "@/components/AnimeSelector/AnimeImporter.vue";
import MugenScroll from "vue-mugen-scroll";

@Component({
  components: { AnimeImporter, MediaCard, MugenScroll },
  computed: {
    ...mapPreferences({ ampm: { defaultValue: true } }),
    ...mapGetters(["isLoggedIn", "isAdmin"])
  }
})
export default class MediaList extends Vue {
  medias: Media[] = [];
  loading = false;
  endPage = false;
  page = 0;
  search = "";
  width = 350;

  mounted() {
    this.getMedias();
    this.onResize();
  }

  onResize() {
    this.width = document.documentElement.clientWidth;
  }

  addMedia(media: Media) {
    this.medias.unshift(media);
  }

  @Watch("search")
  searchMedia() {
    this.page = 0;
    this.getMedias();
  }

  getNext() {
    if (this.medias.length > 0 && !this.endPage) {
      this.page += 1;
      this.getMedias(true);
    }
  }

  getMedias(next = false) {
    this.loading = true;
    this.endPage = false;
    axios
      .get("/api/media", {
        params: {
          search: this.search,
          full: next ? undefined : "true",
          page: this.page
        }
      })
      .then(r => r.data)
      .then((medias: Media[]) => {
        if (medias.length === 0) {
          this.endPage = true;
        }
        if (next) {
          this.medias = this.medias.concat(medias);
        } else {
          this.medias = medias;
        }
        this.loading = false;
      });
  }
}
</script>

<style lang="scss"></style>
