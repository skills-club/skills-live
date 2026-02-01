import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/root.css'],

  modules: ['@vueuse/nuxt', 'shadcn-nuxt'],

  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },

  vite: {
    plugins: [
      tailwindcss(),
    ]
  },
})