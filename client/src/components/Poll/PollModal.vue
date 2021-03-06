<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn
        v-if="!pollToEdit"
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
      <v-list-item v-if="pollToEdit" v-on="on">
        <v-list-item-icon>
          <v-icon color="gray">fas fa-pencil-alt</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Edit poll</v-list-item-title>
      </v-list-item>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline" v-if="!pollToEdit">
          New poll
        </span>
        <span class="headline" v-if="pollToEdit">Edit poll</span>
      </v-card-title>
      <v-form ref="form" lazy-validation @submit="save()">
        <v-tabs v-model="tab">
          <v-tab>Details</v-tab>
          <v-tab>Image</v-tab>
          <v-tab>Discord image</v-tab>
          <v-tab>Options</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col cols="8">
                  <v-text-field
                    label="Title"
                    v-model="poll.title"
                    :rules="[
                      v => !!v || 'Title is required',
                      v =>
                        (v && v.length <= 150) ||
                        'Title must be less than 150 characters'
                    ]"
                  />
                </v-col>
                <v-col cols="4">
                  <v-datetime-picker
                    label="Result date"
                    v-model="end"
                    :text-field-props="{
                      rules: [v => !!v || 'Start is required']
                    }"
                  >
                    <template v-slot:dateIcon>
                      <v-icon>fas fa-calendar-alt</v-icon>
                    </template>
                    <template v-slot:timeIcon>
                      <v-icon>fas fa-clock</v-icon>
                    </template>
                  </v-datetime-picker>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-textarea label="Description" v-model="poll.description" />
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col>
                  <v-file-input v-model="image" />
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-img :src="imagePreview" width="350" />
                </v-col>
                <v-col>
                  <v-btn @click="resetImage">
                    Reset default
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col>
                  <v-file-input v-model="discordImage" />
                </v-col>
              </v-row>
              <v-row v-if="discordImagePreview">
                <v-col>
                  <v-img :src="discordImagePreview" width="350" />
                </v-col>
                <v-col>
                  <v-btn @click="resetdiscordImage">
                    Reset default
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tab-item>
          <v-tab-item>
            <v-card-text>
              <anime-selector v-model="poll.options" />
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
import { Poll } from "@/types";
import AnimeSelector from "../AnimeSelector/Poll.vue";
import axios from "@/plugins/axios";
import { cloneDeep } from "lodash";
import moment from "moment";
import { serialize } from "object-to-formdata";

@Component({
  components: { AnimeSelector }
})
export default class PollModal extends Vue {
  @Prop() pollToEdit?: Poll;
  dialog = false;
  poll: Poll = {
    title: "",
    image: "",
    discordImage: "",
    options: [],
    end: moment().add(1, "week")
  } as Poll;
  loading = false;
  tab = "details";
  image: File | null = null;
  discordImage: File | null = null;

  get imagePreview() {
    if (this.image) {
      return URL.createObjectURL(this.image);
    }
    return this.poll.image;
  }

  resetImage() {
    this.image = null;
    this.poll.image = "";
  }

  get discordImagePreview() {
    if (this.discordImage) {
      return URL.createObjectURL(this.discordImage);
    }
    return this.poll.discordImage;
  }

  resetdiscordImage() {
    this.discordImage = null;
    this.poll.discordImage = "";
  }

  mounted() {
    if (this.pollToEdit) {
      this.poll = cloneDeep(this.pollToEdit);
    }
  }

  get end() {
    return this.poll.end.toDate();
  }

  set end(date) {
    this.form.resetValidation();
    this.poll.end = moment(date);
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
    if (this.pollToEdit) {
      this.form.resetValidation();
    } else {
      this.form.reset();
      this.poll.options = [];
    }
    this.$emit("close");
  }

  save() {
    if (this.form.validate()) {
      const poll = { json: JSON.stringify(this.poll) };
      this.loading = true;
      if (this.pollToEdit) {
        axios.post("/api/polls", serialize(poll)).then(() => {
          this.close();
          this.loading = false;
          this.$emit("save");
        });
      } else {
        axios.put("/api/polls", serialize(poll)).then(() => {
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
