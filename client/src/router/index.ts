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
    name: "Polls",
    component: () => import("../views/Poll.vue")
  },
  {
    path: "/media",
    name: "MediaList",
    component: () => import("../views/Media/MediaList.vue")
  },
  {
    path: "/media/:id",
    name: "MediaItem",
    component: () => import("../views/Media/MediaItem.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
