import { defineConfig, devices } from "@playwright/test";

// Les tests tournent sur la version de production (build + preview), CSP comprise.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    // Même chemin de base que le build testé (« /lifequest/ » en CI).
    baseURL: `http://localhost:4173${process.env.BASE_PATH ?? "/"}`,
    ...devices["Pixel 7"],
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: "npx vite preview --port 4173 --strictPort",
    url: `http://localhost:4173${process.env.BASE_PATH ?? "/"}`,
    reuseExistingServer: !process.env.CI,
  },
});
