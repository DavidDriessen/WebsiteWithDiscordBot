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
          <v-card-title
            class="text-truncate text-no-wrap"
            :style="'display: block; font-size: 16px;'"
          >
            {{ poll.title }}
          </v-card-title>
          <v-card-subtitle>{{ poll.description }}</v-card-subtitle>
          <v-card-text>
            <v-list>
              <v-list-item v-for="option in poll.options" :key="option.id">
                <v-menu>
                  <template v-slot:activator="{ onInterest }">
                    <v-chip
                      :color="voteToColor(option.voted)"
                      v-on="onInterest"
                    >
                      {{ getContent(option) }}
                    </v-chip>
                  </template>
                  <v-list>
                    <v-list-item
                      v-for="(choice, key) in [
                        'No interest',
                        'Interested',
                        'Good show',
                        'Need to watch'
                      ]"
                      @click="vote(option, key)"
                      :key="key"
                    >
                      <v-chip :color="voteToColor(key)">
                        {{ choice }}
                      </v-chip>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </template>

      <v-list>
        <poll-results :poll="poll" />
        <poll-modal
          :poll-to-edit="poll"
          @save="$emit('save')"
          @close="menu = false"
        />
        <v-dialog v-model="deleteDialog" width="400">
          <template v-slot:activator="{ on }">
            <v-list-item v-on="on">
              <v-list-item-icon>
                <v-icon color="red">fas fa-minus</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Delete poll</v-list-item-title>
            </v-list-item>
          </template>
          <v-card>
            <v-card-title>Delete poll?</v-card-title>
            <v-card-text>
              Are you sure you want to delete this poll?
              <v-chip>{{ poll.title }}</v-chip>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="blue" text @click="deleteDialog = false">
                No, don't
              </v-btn>
              <v-btn
                color="red"
                text
                @click="deletePoll()"
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
import PollModal from "@/components/Poll/PollModal.vue";
import { Poll, PollOption, PollOptionType, Series } from "@/types";
import { mapGetters } from "vuex";
import axios from "@/plugins/axios";
import PollResults from "@/components/Poll/PollResults.vue";

@Component({
  components: { PollResults, PollModal },
  computed: { ...mapGetters(["isLoggedIn"]) }
})
export default class PollCard extends Vue {
  @Prop() poll!: Poll;
  @Prop() width!: number;
  @Prop() history!: boolean;
  @Prop() ampm!: boolean;
  dialog = false;
  menu = false;
  deleteDialog = false;
  deleteLoading = false;
  isLoggedIn!: boolean;

  get small() {
    return this.width < 300;
  }

  voteToColor(vote: number | undefined) {
    switch (vote) {
      case 3:
        return "#DAA520";
      case 2:
        return "green";
      case 1:
        return "blue";
      case 0:
        return "red";
      default:
        return "gray";
    }
  }

  deletePoll() {
    this.deleteLoading = true;
    axios
      .delete("/api/polls/" + this.poll.id, {
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

  getContent(option: PollOption) {
    switch (option.type) {
      case PollOptionType.Series:
        if (option.content) {
          const title = (option.content as Series).title;
          if (title) {
            return title;
          }
          return "";
        }
        break;
      default:
        return option.content;
    }
    return "Error loading content.";
  }

  vote(option: PollOption, choice: number) {
    if (this.isLoggedIn) {
      axios.post(
        "/api/polls/vote",
        { option: option.id, choice },
        {
          headers: {
            Authorization: `Bearer ${localStorage.token}`
          }
        }
      );
      option.voted = choice;
    } else {
      this.$emit("notLoggedin");
    }
  }
}
</script>

<style lang="scss"></style>
