<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn
        v-if="!mediaToEdit"
        fixed
        dark
        fab
        bottom
        right
        color="primary"
        v-on="on"
      >
        <v-icon>fas fa-plus</v-icon>
      </v-btn>
      <v-list-item v-if="mediaToEdit" v-on="on">
        <v-list-item-icon>
          <v-icon color="gray">fas fa-pencil-alt</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Edit poll</v-list-item-title>
      </v-list-item>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline" v-if="!mediaToEdit">
          New media
        </span>
        <span class="headline" v-if="mediaToEdit">Edit media</span>
      </v-card-title>
      <v-form ref="form" lazy-validation @submit="save()">
        <v-tabs v-model="tab">
          <v-tab>Details</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col cols="8">
                  <v-text-field
                    label="Title"
                    v-model="media.title"
                    :rules="[
                      v => !!v || 'Title is required',
                      v =>
                        (v && v.length <= 150) ||
                        'Title must be less than 150 characters'
                    ]"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-textarea label="Description" v-model="media.description" />
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>
        </v-tabs-items>
      </v-form>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close()" :loading="loading"
          >Close
        </v-btn>
        <v-btn color="blue darken-1" text @click="save()" :loading="loading"
          >Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import {Media, Poll, PollOption, PollOptionType} from '@/types';
import AnimeSelector from "../AnimeSelector/Poll.vue";
import axios from "@/plugins/axios";
import { cloneDeep } from "lodash";
import moment from "moment";

@Component({
  components: { AnimeSelector }
})
export default class MediaModal extends Vue {
  @Prop() mediaToEdit?: Media;
  dialog = false;
  media: Media = { title: "", description: "" } as Media;
  loading = false;
  tab = "details";

  mounted() {
    if (this.mediaToEdit) {
      this.media = cloneDeep(this.mediaToEdit);
    }
  }

  get form() {
    return (this.$refs.form as unknown) as {
      reset(): void;
      resetValidation(): void;
      validate(): boolean;
    };
  }

  close() {
    this.dialog = false;
    if (this.mediaToEdit) {
      this.form.resetValidation();
    } else {
      this.form.reset();
    }
    this.$emit("close");
  }

  save() {
    if (this.form.validate()) {
      const poll = cloneDeep(this.media);
      this.loading = true;
      if (this.mediaToEdit) {
        axios
          .post("/api/polls", poll, {
            headers: {
              Authorization: `Bearer ${localStorage.token}`
            }
          })
          .then(() => {
            this.close();
            this.loading = false;
            this.$emit("save");
          });
      } else {
        axios
          .put("/api/polls", poll, {
            headers: {
              Authorization: `Bearer ${localStorage.token}`
            }
          })
          .then(() => {
            this.close();
            this.loading = false;
            this.$emit("save");
          });
      }
    }
  }
}
</script>

<style lang="scss"></style>
