import Vue from "vue";
import Vuex from "vuex";
import axios from "@/plugins/axios";
import router from "@/router";

Vue.use(Vuex);

interface User {
  name: string;
  role: string;
}

interface States {
  user: User | null;
  newUser: boolean;
}

const store = new Vuex.Store({
  state: {
    user: null,
    newUser: false
  } as States,
  mutations: {
    User(state, user) {
      state.user = user;
    }
  },
  actions: {
    getUser({ commit }) {
      if (localStorage.token) {
        axios
          .get<User>("/api/user")
          .then(response => {
            commit("User", response.data);
            axios.interceptors.response.use(
              response => {
                return response;
              },
              error => {
                if (error.response && error.response.status == 401) {
                  commit("User", null);
                  localStorage.removeItem("token");
                }
                return Promise.reject(error);
              }
            );
          })
          .catch(() => {
            localStorage.removeItem("token");
            window.location.href = "/api/auth/discord";
          });
      }
    },
    setAttending(_context, payload) {
      if (
        !payload.event.attending ||
        payload.state !== payload.event.attending
      ) {
        payload.event.attending = payload.state;
        // noinspection JSIgnoredPromiseFromCall
        axios.post("/api/schedule/attending", {
          id: payload.event.id,
          decision: payload.event.attending
        });
      }
    },
    Logout({ commit }) {
      commit("User", null);
      localStorage.removeItem("token");
      router.push("/");
    }
  },
  getters: {
    isLoggedIn(state) {
      return !!state.user;
    },
    isAdmin(state) {
      return state.user && state.user.role === "Admin";
    }
  },
  modules: {}
});

export default store;
