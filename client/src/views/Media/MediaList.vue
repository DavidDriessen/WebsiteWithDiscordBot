<template>
  <v-container>
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="128">
        <h1>Loading</h1>
      </v-progress-circular>
    </v-overlay>
    <v-data-iterator :items="medias" disable-pagination hide-default-footer>
      <template v-slot:default="{ items }">
        <v-row justify="space-around" style="padding: 20px">
          <media-card
            v-for="(media, index) of items"
            :key="index"
            :cols="3 / 12"
            :media.sync="media"
            :width="350"
          />
        </v-row>
      </template>
    </v-data-iterator>
    <v-btn v-if="isAdmin" fixed fab bottom right color="primary" to="/media/0">
      <v-icon>fas fa-plus</v-icon>
    </v-btn>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Media } from "@/types";
import { mapPreferences } from "vue-preferences";
import AnimeCache from "@/store/animeCache";
import axios from "../../plugins/axios";
import { mapGetters } from "vuex";
import MediaCard from "@/components/Media/MediaCard.vue";

@Component({
  components: { MediaCard },
  computed: {
    ...mapPreferences({ ampm: { defaultValue: true } }),
    ...mapGetters(["isLoggedIn", "isAdmin"])
  }
})
export default class MediaList extends Vue {
  medias: Media[] = [];
  loading = false;

  mounted() {
    this.getMedias();
  }

  getMedias() {
    this.loading = true;
    this.medias = [];
    axios
      .get("/api/media", {
        headers: localStorage.token
          ? {
              Authorization: `Bearer ${localStorage.token}`
            }
          : {}
      })
      .then(async response => {
        await AnimeCache.fetch();
        this.medias = response.data;
        this.loading = false;
      });
  }
}
</script>

<style lang="scss"></style>
