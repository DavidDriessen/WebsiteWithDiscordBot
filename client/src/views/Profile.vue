<template>
  <v-container fluid>
    <v-layout column>
      <v-card>
        <v-card-text>
          <v-flex class="mb-4">
            <v-avatar size="96" class="mr-4">
              <!--suppress HtmlUnknownTarget -->
              <img :src="user.avatar" alt="Avatar" />
            </v-avatar>
          </v-flex>
          <v-text-field v-model="user.name" label="Username"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" :loading="loading" @click.native="update">
            <v-icon left dark>fas fa-check</v-icon>
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { User } from "@/types";

@Component
export default class Profile extends Vue {
  @Prop() user?: User;
  loading = false;
}
</script>
