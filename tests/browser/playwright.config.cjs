const path = require("node:path");
const { defineConfig } = require("playwright/test");

const artifactRoot = "/private/tmp/career-learning-hub-phase14";

module.exports = defineConfig({
  testDir: path.join(__dirname, "specs"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: path.join(artifactRoot, "test-results"),
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: path.join(artifactRoot, "playwright-report"),
      },
    ],
  ],
  globalSetup: path.join(__dirname, "support/global-setup.cjs"),
  globalTeardown: path.join(__dirname, "support/global-teardown.cjs"),
  webServer: {
    command: `"${process.execPath}" "${path.join(
      __dirname,
      "support/services.cjs",
    )}"`,
    cwd: path.resolve(__dirname, "../.."),
    url: "http://127.0.0.1:4173/login",
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "desktop",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "tablet",
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
