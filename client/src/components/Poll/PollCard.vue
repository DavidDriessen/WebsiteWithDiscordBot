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
          <v-img
            v-if="poll.image"
            :src="
              (poll.image.startsWith('/')
                ? 'https://vrotakus.my-server.nl'
                : '') + poll.image
            "
            alt="poll"
            class="white--text align-end poll-image"
          />
          <v-card-title
            class="text-truncate text-no-wrap"
            :style="'display: block; font-size: 16px;'"
          >
            {{ poll.title }}
          </v-card-title>
          <v-card-subtitle>{{ poll.description }}</v-card-subtitle>
          <v-card-text>
            <v-data-table
              :items="poll.options"
              :headers="[
                { text: 'Option', value: 'content' },
                { text: 'Choice', value: 'voted', width: 50 }
              ]"
              hide-default-footer
            >
              <template v-slot:item.content="{ item }">
                {{ item.media ? item.media.title : item.content }}
              </template>
              <template v-slot:item.voted="{ item }">
                <v-select
                  v-model="item.voted"
                  :items="[0, 1, 2, 3, 4, 5]"
                  @change="vote(item)"
                />
              </template>
            </v-data-table>
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
import { Poll, PollOption } from "@/types";
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

  deletePoll() {
    this.deleteLoading = true;
    axios
      .delete("/api/polls/" + this.poll.id)
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

  vote(option: PollOption) {
    if (this.isLoggedIn) {
      axios.post("/api/polls/vote", {
        option: option.id,
        choice: option.voted
      });
    } else {
      this.$emit("notLoggedin");
    }
  }
}
</script>

<style lang="scss">
.poll-image {
  max-width: 350px;
  max-height: 350px * 1.125;
}
</style>
