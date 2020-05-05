import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import store from '@/store';

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
    beforeEnter(to: any, from: any, next: any) {
      if (store.getters.isLoggedIn) next();
      else next(from);
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
