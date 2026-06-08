import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@fullcalendar/react": path.resolve(__dirname, "./node_modules/@fullcalendar/react/dist/index.js"),
      "@fullcalendar/daygrid": path.resolve(__dirname, "./node_modules/@fullcalendar/daygrid/index.js"),
      "@fullcalendar/interaction": path.resolve(__dirname, "./node_modules/@fullcalendar/interaction/index.js"),
      "@fullcalendar/list": path.resolve(__dirname, "./node_modules/@fullcalendar/list/index.js"),
    },
  },
})
