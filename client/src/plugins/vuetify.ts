import "@fortawesome/fontawesome-free/css/all.css";
import Vue from "vue";
import Vuetify from "vuetify/lib";
import DatetimePicker from "vuetify-datetime-picker";
import colors from "vuetify/lib/util/colors";
// import 'vuetify-datetime-picker/src/stylus/main.styl'

Vue.use(DatetimePicker);
Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: "fa"
  },
  theme: {
    themes: {
      light: {
        primary: colors.blue.base,
        secondary: colors.grey.darken1,
        accent: colors.shades.black,
        error: colors.red.accent3,
        background: colors.indigo.lighten5
      },
      dark: {
        primary: colors.blue.darken4,
        secondary: colors.grey.darken3,
        accent: colors.shades.black,
        error: colors.red.accent3,
        background: colors.indigo.base
      }
    }
  }
});
