import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "PYTHONPATH=src ./.venv/bin/alembic upgrade head >/dev/null && PYTHONPATH=src ./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000",
      cwd: "../backend",
      url: "http://127.0.0.1:8000/healthz",
      timeout: 120_000,
      reuseExistingServer: true,
      stdout: "pipe",
      stderr: "pipe",
      name: "backend",
    },
    {
      command: "pnpm dev --host 127.0.0.1 --port 5173",
      cwd: ".",
      url: "http://127.0.0.1:5173",
      timeout: 120_000,
      reuseExistingServer: true,
      stdout: "pipe",
      stderr: "pipe",
      name: "frontend",
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
