<template>
  <v-container style="margin-top: 50px;">
    <v-flex class="d-flex justify-center">
      <v-card style="padding: 30px" width="900">
        <v-img
          alt="Vue logo"
          src="../assets/otaku-logo.png"
          width="200"
          style="margin: auto"
        />
        <v-card-title primary-title class="justify-center">
          Welcome to the VROtakus website.
        </v-card-title>
        <v-card-text>
          Welcome to VR Otakus where the goal is to provide a place for people
          to schedule anime and gaming sessions, both in VR and 2D, as well as
          discuss related interests.
          <br /><br />
          If you are interested in either streaming, or setting up game
          sessions, let me know.
          <br /><br />
          You can see all the currently planned sessions in
          <router-link to="schedule">schedule</router-link>. Anime sessions will
          be held in Bigscreen unless otherwise stated. You can sign up there by
          clicking on <v-icon color="green">fas fa-check-circle</v-icon> if you
          are going to attend,
          <v-icon color="red">fas fa-times-circle</v-icon> if you can't, and
          <v-icon color="gray">fas fa-question-circle</v-icon> if you're not
          sure. <br /><br />
          To indicate your general availability, please fill out the times you
          are available to watch things (including times taking up by existing
          sessions, so we can see if the current times work for most people) by
          going to
          <a href="https://www.when2meet.com/?8115701-XvRcv">
            https://www.when2meet.com/?8115701-XvRcv </a
          >. Ignore the dates listed, we are just using this as a general weekly
          thing. To fill it out, type in the name you use in Discord and press
          sign in (setting a password is optional). Then just block out the
          times you are available at on the left. It should automatically be
          adjusted to your timezone, but if it's not automatically detected, you
          can change it using the drop down on the top left of the page. Feel
          free to come back to this page and update it should your availability
          change in the future because of school, work, or other RL events.
          <br /><br />
          <a href="https://discord.io/vrotakus"
            >Click here to join the Discord server.</a
          >
        </v-card-text>
      </v-card>
      <v-card flat width="">
        <v-card-text>
          <iframe
            src="https://discordapp.com/widget?id=601206713957351444&theme=dark"
            width="100%"
            height="500"
            allowtransparency="true"
            style="border: 0"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          />
        </v-card-text>
      </v-card>
    </v-flex>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Home extends Vue {}
</script>

<style lang="scss"></style>
