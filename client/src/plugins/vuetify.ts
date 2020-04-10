import "@fortawesome/fontawesome-free/css/all.css";
import Vue from "vue";
import Vuetify from "vuetify/lib";
import DatetimePicker from "vuetify-datetime-picker";
// import 'vuetify-datetime-picker/src/stylus/main.styl'

Vue.use(DatetimePicker);
Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: "fa"
  }
});
