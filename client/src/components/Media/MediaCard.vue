<!--suppress ALL -->
<template>
  <v-lazy>
    <v-card
      :width.sync="width"
      :min-height.sync="height"
      style="margin-bottom: 40px"
      hover
      :to="'/media/' + media.id"
    >
      <v-img class="media-image" :src="media.image" />
      <v-card-title class="media-title">
        {{ media.title }}
      </v-card-title>
    </v-card>
  </v-lazy>
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
  @Prop() height!: number;
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
      .delete("/api/media/" + this.media.id)
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

<style lang="scss">
.media-image {
  max-width: 350px;
  max-height: 350px * 1.125;
}
@media (max-width: 816px) {
  .media-title {
    font-size: 14px!important;
  }
  .media-image {
    max-width: 150px;
    max-height: 150px * 1.125;
  }
}
</style>
