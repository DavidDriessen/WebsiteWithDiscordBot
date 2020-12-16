<template>
  <v-container fluid>
    <v-flex class="d-flex justify-center">
      <v-card width="1000" style="margin-top: 50px" flat>
        <v-form ref="form">
          <v-card-title><b>User Profile</b></v-card-title>
          <v-tabs vertical>
            <v-tab>
              <v-icon left>fas fa-user-alt</v-icon>
              Account details
            </v-tab>
            <v-tab disabled>
              <v-icon left>fas fa-business-time</v-icon>
              Availability
            </v-tab>
            <v-tab disabled>
              <v-icon left>fas fa-bell</v-icon>
              Notification Settings
            </v-tab>
            <v-tab @click="logout">
              <v-icon left>fas fa-times</v-icon>
              Logout
            </v-tab>

            <v-tab-item>
              <v-card flat>
                <v-card-text>
                  <v-row>
                    <v-col sm="12" md="4">
                      <v-flex class="d-flex justify-center">
                        <v-avatar size="96" class="mr-4">
                          <!--suppress HtmlUnknownTarget -->
                          <img :src="user.avatar" alt="Avatar" />
                        </v-avatar>
                      </v-flex>
                    </v-col>
                    <v-col sm="12" md="8">
                      <v-text-field v-model="user.name" label="Username" />
                      <v-text-field v-model="user.email" label="email" />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item>
              <v-card flat>
                <v-card-text> </v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item>
              <v-card flat>
                <v-card-text> </v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs>
          <v-card-actions>
            <v-spacer />
            <v-btn :color="color" :loading="loading" @click.native="update">
              <v-icon left dark>fas fa-check</v-icon>
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-flex>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { User } from "@/types";
import axios from "@/plugins/axios";

@Component
export default class Profile extends Vue {
  user = {} as User;
  loading = false;
  color = "primary";

  mounted() {
    this.user = this.$store.state.user;
  }

  get form() {
    return (this.$refs.form as unknown) as {
      reset(): void;
      resetValidation(): void;
      validate(): boolean;
    };
  }

  update() {
    if (this.form.validate()) {
      this.loading = true;
      axios
        .post("/api/user", this.user)
        .then(() => {
          this.loading = false;
          this.color = "success";
        })
        .catch(() => {
          this.loading = false;
          this.color = "danger";
        });
    } else {
      this.color = "danger";
    }
  }

  logout() {
    this.$store.dispatch("Logout");
  }
}
</script>

<style lang="scss">
.v-tab {
  font-size: 11px;
  justify-content: right;
}
/*.v-tabs-slider-wrapper {*/
/*  left: auto !important;*/
/*  right: 0 !important;*/
/*}*/
</style>
