<template>
  <v-container style="margin-top: 100px;">
    <v-flex class="d-flex justify-center">
      <v-card width="800">
        <v-img src="../assets/underconstruct.png" />
      </v-card>
    </v-flex>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class UnderConstruction extends Vue {}
</script>
