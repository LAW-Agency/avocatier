import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "electron-vite"

// Logique pure partagée avec le site (dates, devises, règles des saisons, libellés des statuts) :
// lue directement dans ../lib/reservation, jamais recopiée
const partage = resolve(__dirname, "../lib/reservation")

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: { alias: { "@partage": partage } },
    plugins: [react()],
    server: { fs: { allow: [resolve(__dirname), partage] } },
  },
})
