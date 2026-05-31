// vitest.config.js — unit-test config (kept separate from vite.config.js so the
// build/dev config stays untouched). Runs *.test.{js,jsx} under src/ in jsdom.
// e2e lives under e2e/ and is run by Playwright, not Vitest.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{js,jsx}"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
