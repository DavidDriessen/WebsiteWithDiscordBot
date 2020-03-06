import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

interface User {
  name: string;
}

export default new Vuex.Store({
  state: {
    user: null as User | null,
    newUser: false
  },
  mutations: {},
  actions: {
    getUser() {
      console.log(localStorage.token);
      axios
        .get<User>("/api/user", {
          headers: {
            authorization: `Bearer ${localStorage.token}`
          }
        })
        .then(response => {
          this.state.user = response.data;
        })
        .catch(console.log);
    }
  },
  modules: {}
});
