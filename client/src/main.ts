import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import VuePreferences from "vue-preferences";

Vue.config.productionTip = false;

Vue.use(VuePreferences);

const app = new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");

// noinspection JSIgnoredPromiseFromCall
app.$store.dispatch("getUser");

app.$vuetify.theme.dark = localStorage.dark;
