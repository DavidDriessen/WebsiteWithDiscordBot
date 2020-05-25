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
        <event-details :event="event" :small="small">
          <template v-slot:activator="{ onClick }">
            <v-card
              :width.sync="width"
              style="margin-bottom: 40px"
              hover
              @contextmenu.prevent="on.click"
              @click="onClick"
            >
              <EventCardImage :image="event.image" :series="event.series"/>
              <!--            <v-icon class="info-icon">fas fa-info-circle</v-icon>-->
              <v-card-title
                class="text-truncate text-no-wrap"
                :style="'display: block; font-size: 16px;'"
              >
                {{ event.title }}
              </v-card-title>
              <v-card-subtitle>{{ time }}</v-card-subtitle>
              <EventActions v-if="isLoggedIn && !history" :event="event"/>
              <v-icon class="info-icon">fas fa-info-circle</v-icon>
            </v-card>
          </template>
        </event-details>
      </template>

      <v-list>
        <EventModal
          :event-to-edit="event"
          @save="$emit('save')"
          @close="menu = false"
        />
        <EventModal
          :event-to-clone="event"
          @save="$emit('save')"
          @close="menu = false"
        />
        <EventModal
          :event-to-clone="event"
          @save="$emit('save')"
          @close="menu = false"
          :next="true"
        />
        <v-dialog v-model="deleteDialog" width="400">
          <template v-slot:activator="{on}">
            <v-list-item v-on="on">
              <v-list-item-icon>
                <v-icon color="red">fas fa-minus</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Delete event</v-list-item-title>
            </v-list-item>
          </template>
          <v-card>
            <v-card-title>Delete event?</v-card-title>
            <v-card-text>Are you sure you want to delete this event?
              <v-chip>{{ event.title }}</v-chip>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="blue" text @click="deleteDialog = false">No, don't</v-btn>
              <v-btn color="red" text @click="deleteEvent()" :loading="deleteLoading">Yes, please</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-list>
    </v-menu>
  </v-lazy>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import EventDetails from '@/components/Event/EventDetails.vue';
  import EventModal from '@/components/Event/EventModal.vue';
  import {Event} from '@/types';
  import moment, {Moment} from 'moment';
  import EventActions from '@/components/Event/EventActions.vue';
  import EventCardImage from '@/components/Event/EventCardImage.vue';
  import {mapGetters} from 'vuex';
  import axios from '@/plugins/axios';

  @Component({
    components: {EventCardImage, EventActions, EventDetails, EventModal},
    computed: {...mapGetters(['isLoggedIn'])}
  })
  export default class EventCard extends Vue {
    @Prop() event!: Event;
    @Prop() width!: number;
    @Prop() history!: boolean;
    @Prop() ampm!: boolean;
    dialog = false;
    menu = false;
    deleteDialog = false;
    deleteLoading = false;
    intervals: { time: number; now: Moment } = {time: 0, now: moment()};

    mounted() {
      this.intervals.time = setInterval(() => {
        this.intervals.now = moment();
      }, 30000);
    }

    beforeDestroy() {
      clearInterval(this.intervals.time);
    }

    get time() {
      const timeFormat = this.ampm ? 'h:mma' : 'H:mm';
      if (this.intervals.now.isBetween(this.event.start, this.event.end)) {
        return 'Now';
      } else if (
        this.event.start.isBetween(
          this.intervals.now,
          this.intervals.now.clone().add(3, 'hour')
        )
      ) {
        return this.event.start.fromNow();
      } else if (
        this.event.start.isBetween(
          this.intervals.now,
          this.intervals.now.clone().add(1, 'day')
        )
      ) {
        return 'Today at ' + this.event.start.format(timeFormat);
      } else if (
        this.event.start.isBetween(
          this.intervals.now,
          this.intervals.now.clone().add(2, 'day')
        ) &&
        (!this.small || !this.ampm)
      ) {
        return 'Tomorrow at ' + this.event.start.format(timeFormat);
      } else if (
        this.event.start.isBetween(
          this.intervals.now,
          this.intervals.now.clone().add(1, 'week')
        )
      ) {
        if (this.small) {
          return this.event.start.format('ddd [at] ' + timeFormat);
        } else {
          return this.event.start.format('dddd [at] ' + timeFormat);
        }
      } else {
        return this.event.start.format('D MMM, ' + timeFormat);
      }
    }

    get small() {
      return this.width < 300;
    }

    get seriesTitles() {
      return this.event.series.map(series => {
        if (!series.details) {
          return '';
        }
        return (
          series.details.title.english +
          ' #' +
          series.episode +
          (series.episodes > 1
            ? '-' + (series.episode + series.episodes - 1)
            : '')
        );
      });
    }

    deleteEvent() {
      this.deleteLoading = true;
      axios
        .delete('/api/schedule/' + this.event.id, {
          headers: {
            Authorization: `Bearer ${localStorage.token}`
          }
        })
        .then(response => {
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
