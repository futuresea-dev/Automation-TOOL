<template lang="pug">
    div.d-flex.justify-content-between.align-items-center.user-select-none
      h5.m-0.text-capitalize.d-flex.align-items-center
        IconVue.mr-2.text-black-50(:name="'user'" :hasBackground="false" :size="1.6" :strokeWidth="2" :isBtn="false")
        span.text-black-50.mr-1 hi,
        span Jasper
      div.d-flex.align-items-center
        //- nuxt-link.p-1.mx-1(v-if="hasSettings || hasDashboard" :to="hasSettings?'/settings':'/'")
        //-   IconVue.text-primary(:name="(hasSettings?'settings':'home')" :hasBackground="false" :size="1.6" :strokeWidth="2")
        div.form-check.form-switch.ml-5
          input(class="form-check-input" type="checkbox" v-model="dark" @click.stop="dark=!dark;setDarkMode();")
          label(for="darkSwitch") {{dark? 'Light': 'Dark'}}
</template>

<script>
import IconVue from '../components/Icon.vue';

export default {
  name: 'Header',
  components: {
    IconVue,
  },
  props: {
    hasSettings: {
      type: Boolean,
      default: true,
    },
    hasDashboard: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dark: false,
    };
  },
  mounted() {
    this.dark = localStorage.dark ? localStorage.getItem('dark') * 1 : 0;
    this.setDarkMode();
  },
  methods: {
    async logout() {
      await this.$auth.logout();
    },

    setDarkMode() {
      if (this.dark) {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('dark', '1');
      } else {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('dark', '0');
      }
    },
  },
};
</script>
