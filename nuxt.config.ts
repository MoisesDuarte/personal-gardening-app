export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/google-fonts'],

  googleFonts: {
    families: {
      Manrope: [400, 500, 600, 700, 800],
      'DM+Mono': [400, 500]
    }
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgres://garden:garden@localhost:5432/garden'
  },

  typescript: { strict: true, typeCheck: false },
  compatibilityDate: '2026-09-14'
})