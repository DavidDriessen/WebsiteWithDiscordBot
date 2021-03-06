<template>
  <v-app>
    <v-app-bar color="primary" app dark>
      <v-toolbar-title>
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
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <v-tooltip bottom v-if="mobile">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" small fab @click="darkMode" icon>
            <v-icon :color="!$vuetify.theme.dark ? 'black' : 'white'">
              fas fa-adjust
            </v-icon>
          </v-btn>
        </template>
        <span v-if="!$vuetify.theme.dark">Dark Mode On</span>
        <span v-else>Dark Mode Off</span>
      </v-tooltip>
      <v-toolbar-items v-if="!mobile">
        <v-btn to="/media" text v-if="isAdmin">
          <span class="mr-2">Medias</span>
        </v-btn>
        <v-btn to="/polls" text>
          <span class="mr-2">Polls</span>
        </v-btn>
        <v-btn to="/schedule" text>
          <span class="mr-2">Schedule</span>
        </v-btn>
        <v-btn v-if="!isLoggedIn" href="/api/auth/discord" text>
          Login
        </v-btn>
        <v-btn v-if="isLoggedIn" to="/profile" text>
          Profile
        </v-btn>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" small fab @click="darkMode" icon>
              <v-icon :color="!$vuetify.theme.dark ? 'black' : 'white'">
                fas fa-adjust
              </v-icon>
            </v-btn>
          </template>
          <span v-if="!$vuetify.theme.dark">Dark Mode On</span>
          <span v-else>Dark Mode Off</span>
        </v-tooltip>
      </v-toolbar-items>
      <v-app-bar-nav-icon v-if="mobile" @click="drawer = !drawer" />
    </v-app-bar>
    {{ mobile }}
    <v-navigation-drawer :value="drawer && mobile" app temporary right>
      <v-list nav>
        <v-list-item two-line class="px-0" v-if="isLoggedIn">
          <v-list-item-avatar>
            <!--suppress HtmlUnknownTarget -->
            <v-img :src="user.avatar" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ user.name }}</v-list-item-title>
            <v-list-item-subtitle></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider v-if="isLoggedIn" />
        <v-list-item to="/media" v-if="isAdmin">
          <v-list-item-icon>
            <v-icon>fas fa-photo-video</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Medias</v-list-item-title>
        </v-list-item>
        <v-list-item to="/polls">
          <v-list-item-icon>
            <v-icon>fas fa-poll</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Polls</v-list-item-title>
        </v-list-item>
        <v-list-item to="/schedule">
          <v-list-item-icon>
            <v-icon>fas fa-calendar</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Schedule</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item v-if="isLoggedIn" to="/profile">
          <v-list-item-icon>
            <v-icon>fas fa-user-alt</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <template v-slot:append>
        <div class="pa-2">
          <v-btn v-if="!isLoggedIn" href="/api/auth/discord" block>Login</v-btn>
          <v-btn v-if="isLoggedIn" @click="logout" block>Logout</v-btn>
        </div>
      </template>
    </v-navigation-drawer>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters, mapState } from "vuex";

export default Vue.extend({
  name: "App",
  components: {},
  data: () => ({
    drawer: false
  }),
  computed: {
    ...mapGetters(["isLoggedIn", "isAdmin"]),
    ...mapState(["user"]),
    mobile() {
      switch (this.$vuetify.breakpoint.name) {
        case "xs":
          return true;
        case "sm":
          return true;
        case "md":
          return false;
        case "lg":
          return false;
        case "xl":
          return false;
        default:
          return true;
      }
    }
  },
  watch: {
    mobile(value) {
      if (!value) {
        this.drawer = false;
      }
    }
  },
  methods: {
    logout() {
      this.$store.dispatch("Logout");
    },
    darkMode() {
      localStorage.dark = this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    }
  }
});
</script>
