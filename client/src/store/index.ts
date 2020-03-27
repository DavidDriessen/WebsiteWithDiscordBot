import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

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
        getUser({commit}) {
            if (localStorage.token) {
                axios
                    .get<User>("/api/user", {
                        headers: {
                            authorization: `Bearer ${localStorage.token}`
                        }
                    })
                    .then(response => {
                        commit('User', response.data);
                    })
                    .catch(error => {
                        localStorage.clear()
                    });
            }
        }
    },
    getters: {
        isLoggedIn(state){
            return !!state.user;
        },
        isAdmin(state){
            return state.user && state.user.role === "Admin";

        }
    },
    modules: {}
});
