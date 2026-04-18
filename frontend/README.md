# Frontend

React + Vite frontend for the AI News Review authentication flow.

## Stack

- React
- Vite
- pnpm
- ESLint
- Tailwind CSS
- Playwright

## Development

```bash
pnpm install
pnpm dev
```

The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:8000`.

## Build

```bash
pnpm build
pnpm preview
```

## Tests

```bash
pnpm test
pnpm test:e2e
```

`pnpm test:e2e` starts the frontend Vite server and the FastAPI backend automatically via Playwright `webServer` configuration.

## Environment

Create a `.env` file only if you want to override the API origin:

```bash
VITE_API_BASE_URL=https://your-backend.example.com
```

If `VITE_API_BASE_URL` is not set, the app uses `/api` so local development works with the built-in Vite proxy.
