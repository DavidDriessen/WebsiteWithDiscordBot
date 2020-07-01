<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn v-if="!pollToEdit && !eventToClone" color="primary" dark v-on="on">
        Add poll
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
          <v-tab>Options</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <v-card-text>
              <v-row>
                <v-col cols="12">
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
              <autocomplete-anime
                v-for="option of poll.options"
                :key="option.id"
                v-model="option.content"
              />
              <v-btn @click="addSerieOption">Add option</v-btn>
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
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {Poll, PollOption, PollOptionType} from '@/types';
  import AutocompleteAnime from '../AutocompleteAnime.vue';
  import axios from '@/plugins/axios';
  import {cloneDeep} from 'lodash';
  import moment from 'moment';

  @Component({
  components: { AutocompleteAnime }
})
export default class PollModal extends Vue {
  @Prop() pollToEdit?: Poll;
  dialog = false;
  poll: Poll = { title: "", options: [], end: moment() } as Poll;
  loading = false;
  tab = "details";

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

  addSerieOption() {
    this.poll.options.push({
      type: PollOptionType.Series
    } as PollOption);
  }

  save() {
    if (this.form.validate()) {
      const poll = cloneDeep(this.poll);
      for(const option of poll.options){
        if(option.type == PollOptionType.Series && typeof option.content == 'object'){
          option.content = option.content.id;
        }
      }
      this.loading = true;
      if (this.pollToEdit) {
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
