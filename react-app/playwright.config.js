import { defineConfig, devices } from "@playwright/test";

// Frontend-only e2e: drives the built app served by `vite preview`. All calls to
// the n8n backend are mocked inside the specs, so these tests never touch the
// live agent, database or email — they verify the APP, deterministically.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/e2e-results.json" }]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
