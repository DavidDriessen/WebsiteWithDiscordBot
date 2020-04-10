import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";

Vue.use(Vuex);

interface User {
  name: string;
  role: string;
}

export default new Vuex.Store({
  state: {
    user: null as User | null,
    newUser: false
  },
  mutations: {
    User(state, user) {
      state.user = user;
    }
  },
  actions: {
    getUser({ commit }) {
      if (localStorage.token) {
        axios
          .get<User>("/api/user", {
            headers: {
              Authorization: `Bearer ${localStorage.token}`
            }
          })
          .then(response => {
            commit("User", response.data);
            axios.interceptors.response.use(
              response => {
                return response;
              },
              error => {
                if (error.response && error.response.status == 401) {
                  commit("User", null);
                  localStorage.clear();
                }
                return Promise.reject(error);
              }
            );
          })
          .catch(() => {
            localStorage.clear();
          });
      }
    },
    setAttending({ state }, payload) {
      if (!payload.event.attending || payload.state !== payload.event.attending.decision) {
        if (payload.event.attending)
          payload.event.attending.decision = payload.state;
        else payload.event.attending = { decision: payload.state };
        // noinspection JSIgnoredPromiseFromCall
        axios.post(
          "/api/schedule/attending",
          {
            id: payload.event.id,
            decision: payload.event.attending.decision
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.token}`
            }
          }
        );
      }
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
