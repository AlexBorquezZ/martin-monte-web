import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}/ritmo/`,
    ...devices['Pixel 7'],
    // Chrome para Android se emula con Chromium de escritorio + viewport/UA móvil.
    browserName: 'chromium',
    serviceWorkers: 'allow',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Mendoza',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/ritmo/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
