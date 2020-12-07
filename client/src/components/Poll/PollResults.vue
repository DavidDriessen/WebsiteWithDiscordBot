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
import EventActions from "@/components/Event/EventActions.vue";
import { mapGetters } from "vuex";
import { Poll } from "@/types";
import Chart from "@/components/AnimeSelector/Chart.vue";

@Component({
  components: { Chart, EventActions },
  computed: { ...mapGetters(["isLoggedIn", "isAdmin"]) }
})
export default class PollResults extends Vue {
  @Prop() poll!: Poll;
  dialog = false;
  mode = 0;
  modes = [
    { value: 0, text: "default" },
    { value: 1, text: "1" },
    { value: 2, text: "2" },
    { value: 3, text: "3" },
    { value: 4, text: "4" }
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
      return [
        this.poll.options.map(option => option.votes[0]),
        this.poll.options.map(option => option.votes[1]),
        this.poll.options.map(option => option.votes[2]),
        this.poll.options.map(option => option.votes[3])
      ];
    }
    return [];
  }
}
</script>
