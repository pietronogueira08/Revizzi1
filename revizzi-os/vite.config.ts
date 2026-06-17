import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/admin',
  build: {
    outDir: '../public/admin',
    emptyOutDir: true,
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
})
