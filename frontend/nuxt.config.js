export default {
  generate: {
    dir: './../backend/public',
  },
  ssr: false,
  target: 'server',

  head: {
    title: 'AS24 POSTER',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || '',
      },
    ],
    script: [
      {
        src: '/bootstrap.bundle.js',
      },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'stylesheet',
        href: '/Quicksand.css',
      },
      {
        rel: 'stylesheet',
        href: '/bootstrap.min.css',
      },
    ],
  },

  css: ['@/assets/dark.scss'],
  plugins: [],

  components: true,

  buildModules: ['@nuxtjs/eslint-module'],
  modules: ['@nuxtjs/axios'],

  build: {},
};
