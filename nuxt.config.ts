export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: 'Ui',
    componentDir: './components/ui'
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgres://garden:garden@localhost:5432/garden',
    devMode: process.env.DEV_MODE === 'true',
    public: {
      devModeEnabled: process.env.DEV_MODE === 'true'
    }
  },

  typescript: { strict: true, typeCheck: false },
  compatibilityDate: '2026-09-14'
})
