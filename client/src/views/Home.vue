<template>
  <v-container style="margin-top: 50px;">
    <v-flex class="d-flex justify-center">
      <v-card style="padding: 30px" width="700">
        <v-img
          alt="Vue logo"
          src="../assets/otaku-logo.png"
          width="200"
          style="margin: auto"
        />
        <v-card-title primary-title class="justify-center">
          Welcome to the VROtakus website.
        </v-card-title>
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
