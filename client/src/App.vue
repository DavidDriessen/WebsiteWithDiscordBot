<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">
        <v-img
          alt="Vuetify Logo"
          class="shrink mr-2"
          contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition"
          width="40"
        />

        <v-img
          alt="Vuetify Name"
          class="shrink mt-1 hidden-sm-and-down"
          contain
          min-width="100"
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
          width="100"
        />
      </div>

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
  import Vue from 'vue';
  import NewEvent from '@/components/EventModal.vue';

  export default Vue.extend({
  name: "App",
  components: { NewEvent },
  data: () => ({
    //
  })
});
</script>
