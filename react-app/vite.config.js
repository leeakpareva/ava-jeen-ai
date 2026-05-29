// vite.config.js — build/dev config for the Ava webui.
//  • plugins: the React plugin (JSX + fast refresh / HMR).
//  • server: dev server on port 5180, host:true so it's reachable on the LAN.
// Run `npm run dev` (dev server) or `npm run build` (production bundle in dist/).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5180, host: true },
});
