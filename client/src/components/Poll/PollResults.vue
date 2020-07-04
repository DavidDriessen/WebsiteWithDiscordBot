<!--suppress ALL -->
<template>
  <v-dialog v-model="dialog" max-width="600px">
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
      </v-card-title>
      <v-card-text>
        <chart :labels="labels" :values="values" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import EventActions from "@/components/Event/EventActions.vue";
import { mapGetters } from "vuex";
import { Poll, Series, PollOptionType } from "@/types";
import Chart from "@/components/AnimeSelector/Chart.vue";

@Component({
  components: { Chart, EventActions },
  computed: { ...mapGetters(["isLoggedIn", "isAdmin"]) }
})
export default class PollResults extends Vue {
  @Prop() poll!: Poll;
  dialog = false;

  get labels() {
    if (this.poll) {
      return this.poll.options.map(option => {
        let series;
        switch (option.type) {
          case PollOptionType.Series:
            series = option.content as Series;
            return series.title.english || series.title.romaji;
          default:
            return option.content;
        }
      });
    }
    return [];
  }

  get values() {
    if (this.poll) {
      return this.poll.options.map(option => option.users?.length);
    }
    return [];
  }
}
</script>
