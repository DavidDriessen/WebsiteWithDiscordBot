<template>
  <v-container>
    <v-overlay :value="true">
      <v-progress-circular indeterminate size="128">
        <h1>Loading</h1>
      </v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import axios from "axios";

interface JWT {
  jwt: {};
  user: {};
}

@Component
export default class Discord extends Vue {
  mounted() {
    axios
      .post<JWT>("/api/auth/discord", {
        code: this.$route.query.code,
        redirect: window.location.href.split("?")[0]
      })
      .then(response => {
        localStorage.token = response.data.jwt;
        this.$store.commit("User", response.data.user);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${localStorage.token}`;
        this.$store.state.newUser = true;
        this.$router.replace("/");
      });
  }
}
</script>
