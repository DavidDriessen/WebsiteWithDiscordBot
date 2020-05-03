<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <router-link to="/">
        <div class="d-flex align-center" style="color: white;">
          <v-img
            alt="VROtakus Logo"
            class="shrink mr-2"
            contain
            src="./assets/otaku-logo.png"
            transition="scale-transition"
            width="40"
          />
          VROtakus
        </div>
      </router-link>

      <v-spacer></v-spacer>
      <NewEvent v-if="$store.getters.isAdmin" />
      <v-spacer></v-spacer>

      <v-btn to="/schedule" text>
        <span class="mr-2">Schedule</span>
      </v-btn>
      <!--suppress HtmlUnknownTarget -->
      <v-btn v-if="!$store.getters.isLoggedIn" href="/api/auth/discord" text>
        Login
      </v-btn>
      <v-btn v-if="$store.getters.isLoggedIn" to="/profile" text>
        Profile
      </v-btn>
    </v-app-bar>

    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import NewEvent from "@/components/Event/EventModal.vue";

export default Vue.extend({
  name: "App",
  components: { NewEvent },
  data: () => ({
    //
  })
});
</script>
