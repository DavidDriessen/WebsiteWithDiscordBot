<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <h1>Welcome to the website</h1>
    <a
      v-if="!$store.state.user"
      href="https://discordapp.com/api/oauth2/authorize?client_id=661657398527787017&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin%2Fdiscord&response_type=code&scope=identify"
    >
      Login
    </a>
  </div>
</template>

<script>
  import {Component, Vue} from "vue-property-decorator";

  @Component
export default class Home extends Vue {
  mounted() {
    this.$store.dispatch("getUser");
  }
}
</script>
