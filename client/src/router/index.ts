import Vue from "vue";
import VueRouter, { RawLocation, Route } from "vue-router";
import Home from "../views/Home.vue";
import store from "@/store";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/login/discord",
    name: "Discord",
    component: () => import("../views/Discord.vue")
  },
  {
    path: "/schedule",
    name: "Schedule",
    component: () => import("../views/Schedule.vue")
  },
  {
    path: "/profile",
    name: "Profile",
    beforeEnter(
      to: Route,
      from: Route,
      next: (to?: RawLocation | false | void) => void
    ) {
      if (store.getters.isLoggedIn) next();
      else if (from.name) next(false);
      else next("/");
    },
    component: () => import("../views/Profile.vue")
  },
  {
    path: "/polls",
    name: "polls",
    component: () => import("../views/UnderConstruction.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
