import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  // Em desenvolvimento local fica undefined → usa '/' como padrão.
  // Ex: se o repo se chama "quiz-gabriel", defina VITE_BASE_URL=/quiz-gabriel/
  base: process.env.VITE_BASE_URL ?? '/',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})