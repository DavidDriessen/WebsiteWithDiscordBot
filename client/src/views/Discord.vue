<template>
  <div class="discord">
    <h1>Loading</h1>
  </div>
</template>

<script>
  import {Component, Vue} from "vue-property-decorator";
  import axios from "axios";

  @Component
export default class Discord extends Vue {
  mounted() {
    axios
      .post("/api/auth/discord", {
        code: this.$route.query.code,
        redirect: window.location.href.split("?")[0]
      })
      .then(response => {
        localStorage.token = response.data.jwt;
        this.$store.commit("User", response.data.user);
        this.$store.state.newUser = true;
        this.$router.replace("/");
      });
  }
}
</script>
