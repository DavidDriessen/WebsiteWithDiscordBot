<!--suppress ALL -->
<template>
  <v-card
    :width.sync="width"
    style="margin-bottom: 40px"
    hover
    :to="'/media/' + media.id"
  >
    <v-img :src="media.image" height="400" />
    <v-card-title class="text-truncate text-no-wrap">
      {{ media.title }}
    </v-card-title>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Media } from "@/types";
import { mapGetters } from "vuex";
import axios from "@/plugins/axios";

@Component({
  computed: { ...mapGetters(["isLoggedIn"]) }
})
export default class MediaCard extends Vue {
  @Prop() media!: Media;
  @Prop() width!: number;
  dialog = false;
  menu = false;
  deleteDialog = false;
  deleteLoading = false;
  isLoggedIn!: boolean;

  get small() {
    return this.width < 300;
  }

  deleteMedia() {
    this.deleteLoading = true;
    axios
      .delete("/api/media/" + this.media.id, {
        headers: {
          Authorization: `Bearer ${localStorage.token}`
        }
      })
      .then(() => {
        this.$emit("save");
      })
      .catch(error => {
        console.log(error);
      })
      .finally(() => {
        this.deleteLoading = false;
      });
  }
}
</script>

<style lang="scss"></style>
