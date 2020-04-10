import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

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
    component: () => import("../views/UnderConstruction.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
