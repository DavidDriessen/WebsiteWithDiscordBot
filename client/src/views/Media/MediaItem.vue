<template>
  <v-container>
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="128">
        <h1>Loading</h1>
      </v-progress-circular>
    </v-overlay>
    <v-form ref="form" lazy-validation @submit="save()">
      <v-card>
        <v-card-title>
          <v-text-field
            v-model="media.title"
            label="Name"
            :readonly="!editing"
          />
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col>
              <v-tabs>
                <v-tab>Details</v-tab>
                <v-tab-item>
                  <v-row>
                    <v-col cols="3">
                      <v-text-field
                        type="number"
                        :readonly="!editing"
                        label="# episodes"
                        v-model="media.episodes"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        :readonly="!editing"
                        auto-grow
                        label="Description"
                        v-model="media.description"
                      />
                    </v-col>
                  </v-row>
                </v-tab-item>
              </v-tabs>
            </v-col>
            <v-col cols="3">
              <v-img :src="imagePreview" />
              <v-file-input
                accept="image/png, image/jpeg, image/bmp"
                hide-input
                v-model="image"
                v-if="editing"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue darken-1"
            text
            @click="editing = true"
            :loading="loading"
            v-if="isAdmin && !editing"
          >
            Edit
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="save()"
            :loading="loading"
            v-if="editing"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapPreferences } from "vue-preferences";
import axios from "@/plugins/axios";
import { mapGetters } from "vuex";
import MediaCard from "@/components/Media/MediaCard.vue";
import { Media } from "@/types";
import { serialize } from "object-to-formdata";

@Component({
  components: { MediaCard },
  computed: {
    ...mapPreferences({ ampm: { defaultValue: true } }),
    ...mapGetters(["isLoggedIn", "isAdmin"])
  }
})
export default class MediaList extends Vue {
  editing = false;
  media: Media = {
    episodes: 0,
    references: [],
    trailer: "",
    title: "",
    type: "",
    description: "",
    image: "",
    genres: [],
    duration: 0
  };
  image = null;
  loading = false;

  get imagePreview() {
    if (this.image) return URL.createObjectURL(this.image);
    return this.media.image;
  }

  mounted() {
    if (Number(this.$route.params.id) > 0)
      this.getMedia(Number(this.$route.params.id));
  }

  getMedia(id: number) {
    axios.get("/api/media/" + id).then(async response => {
      const r = response.data;
      console.log(r);
      this.media = r;
      this.loading = false;
    });
  }

  get form() {
    return (this.$refs.form as unknown) as {
      reset(): void;
      resetValidation(): void;
      validate(): boolean;
    };
  }

  save() {
    if (this.form.validate()) {
      const data = { json: JSON.stringify(this.media), image: this.image };
      this.loading = true;
      this.editing = false;
      if (this.media.id) {
        axios.post("/api/media", serialize(data)).then(() => {
          this.loading = false;
        });
      } else {
        axios.put("/api/media", serialize(data)).then(() => {
          this.loading = false;
        });
      }
    }
  }
}
</script>

<style lang="scss"></style>
