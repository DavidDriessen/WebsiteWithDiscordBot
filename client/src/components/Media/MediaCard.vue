<!--suppress ALL -->
<template>
  <v-lazy>
    <v-menu
      v-model="menu"
      :disabled="!$store.getters.isAdmin"
      absolute
      close-on-click
      close-on-content-click
    >
      <template v-slot:activator="{ on }">
        <v-card
          :width.sync="width"
          style="margin-bottom: 40px"
          hover
          @contextmenu.prevent="on.click"
        >
          <v-img :src="media.image" />
          <v-card-title
            class="text-truncate text-no-wrap"
            :style="'display: block; font-size: 16px;'"
          >
            {{ media.title }}
          </v-card-title>
          <v-card-subtitle>{{ media.description }}</v-card-subtitle>
        </v-card>
      </template>
      <v-list>
        <media-modal
          :media-to-edit="media"
          @save="$emit('save')"
          @close="menu = false"
        />
        <v-dialog v-model="deleteDialog" width="400">
          <template v-slot:activator="{ on }">
            <v-list-item v-on="on">
              <v-list-item-icon>
                <v-icon color="red">fas fa-minus</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Delete media</v-list-item-title>
            </v-list-item>
          </template>
          <v-card>
            <v-card-title>Delete media?</v-card-title>
            <v-card-text>
              Are you sure you want to delete this media?
              <v-chip>{{ media.title }}</v-chip>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="blue" text @click="deleteDialog = false">
                No, don't
              </v-btn>
              <v-btn
                color="red"
                text
                @click="deleteMedia()"
                :loading="deleteLoading"
              >
                Yes, please
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-list>
    </v-menu>
  </v-lazy>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Media } from "@/types";
import { mapGetters } from "vuex";
import axios from "@/plugins/axios";
import MediaModal from '@/components/Media/MediaModal.vue';

@Component({
  components: {MediaModal },
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
