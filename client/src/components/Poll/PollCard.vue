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
        <poll-details :poll="poll" :small="small">
          <template v-slot:activator="{ onClick }">
            <v-card
              :width.sync="width"
              style="margin-bottom: 40px"
              hover
              @contextmenu.prevent="on.click"
              @click="onClick"
            >
              <v-card-title
                class="text-truncate text-no-wrap"
                :style="'display: block; font-size: 16px;'"
              >
                {{ poll.title }}
              </v-card-title>
              <v-icon class="info-icon">fas fa-info-circle</v-icon>
            </v-card>
          </template>
        </poll-details>
      </template>

      <v-list>
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
              <v-list-item-title>Delete event</v-list-item-title>
            </v-list-item>
          </template>
          <v-card>
            <v-card-title>Delete poll?</v-card-title>
            <v-card-text
            >Are you sure you want to delete this poll?
              <v-chip>{{ poll.title }}</v-chip>
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn color="blue" text @click="deleteDialog = false">
                No, don't
              </v-btn>
              <v-btn
                color="red"
                text
                @click="deleteEvent()"
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
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import PollDetails from '@/components/Poll/PollDetails.vue';
  import PollModal from '@/components/Poll/PollModal.vue';
  import {Poll} from '@/types';
  import moment, {Moment} from 'moment';
  import {mapGetters} from 'vuex';
  import axios from '@/plugins/axios';

  @Component({
    components: {PollDetails, PollModal},
    computed: {...mapGetters(['isLoggedIn'])}
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

    mounted() {
    }

    beforeDestroy() {
    }

    get small() {
      return this.width < 300;
    }

    deletePoll() {
      this.deleteLoading = true;
      axios
        .delete('/api/polls/' + this.poll.id, {
          headers: {
            Authorization: `Bearer ${localStorage.token}`
          }
        })
        .then(() => {
          this.$emit('save');
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

<style lang="scss">
  .info-icon {
    position: absolute !important;
    right: 13px;
    bottom: 13px;
  }
</style>
