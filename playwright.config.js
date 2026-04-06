const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    // Mobile-first viewport — matches the app's design target
    viewport: { width: 390, height: 844 },
    // Use the pre-installed Chromium from the system
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
  webServer: {
    command: 'BROWSER=none npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
