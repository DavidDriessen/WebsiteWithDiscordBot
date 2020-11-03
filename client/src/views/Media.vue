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
            :width="400"
            @save="getMedias"
            @notLoggedin="loginNotice = true"
          />
        </v-row>
      </template>
    </v-data-iterator>
    <media-modal v-if="isAdmin" @save="getMedias" />
    <v-snackbar v-model="loginNotice" :timeout="3000">
      <p class="text-center" style="width: 100%">
        Please login to perform that action.
      </p>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Media } from "@/types";
import { mapPreferences } from "vue-preferences";
import AnimeCache from "@/store/animeCache";
import axios from "../plugins/axios";
import { mapGetters } from "vuex";
import MediaModal from "@/components/Media/MediaModal.vue";
import MediaCard from "@/components/Media/MediaCard.vue";

@Component({
  components: { MediaModal, MediaCard },
  computed: {
    ...mapPreferences({ ampm: { defaultValue: true } }),
    ...mapGetters(["isLoggedIn", "isAdmin"])
  }
})
export default class Polls extends Vue {
  medias: Media[] = [];
  loading = false;
  width = 400;

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
