<template>
  <v-dialog v-model="dialog" max-width="1000px">
    <template v-slot:activator="{ on }">
      <v-list-item v-on="on" v-if="isAdmin">
        <v-list-item-icon>
          <v-icon color="gray">fas fa-chart-bar</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Poll results</v-list-item-title>
      </v-list-item>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">Poll results</span>
        <v-spacer />
        <v-select v-model="mode" :items="modes" />
      </v-card-title>
      <v-card-text>
        <chart :labels="labels" :data="values" :mode="mode" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { mapGetters } from "vuex";
import { Poll } from "@/types";
import Chart from "@/components/AnimeSelector/Chart.vue";

@Component({
  components: { Chart },
  computed: { ...mapGetters(["isLoggedIn", "isAdmin"]) }
})
export default class PollResults extends Vue {
  @Prop() poll!: Poll;
  dialog = false;
  mode = 0;
  modes = [
    { value: 0, text: "Vote choice counted" },
    { value: 1, text: "Number votes" },
    { value: 2, text: "User votes" }
  ];

  get labels() {
    if (this.poll) {
      return this.poll.options.map(option => {
        if (option.media) {
          return option.media.title;
        }
        return option.content;
      });
    }
    return [];
  }

  get values() {
    if (this.poll) {
      return this.poll.options;
    }
    return [];
  }
}
</script>
