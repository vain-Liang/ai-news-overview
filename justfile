# AI News Overview task shortcuts.
# Docs basis: just command runner recipes live in a justfile and can be run as `just <recipe>`.
# OS note: this justfile is sh/bash-oriented. On Windows, use WSL or Git Bash with `sh` in PATH.
# Native PowerShell users can still copy the printed commands from `just windows-notes`.

set dotenv-load := false

backend := "backend"
frontend := "frontend"
host := "127.0.0.1"
api_port := "8000"
ui_port := "5173"
celery_app := "app.tasks.celery_app.celery_app"

# List available recipes.
default:
    @just --list

# Show platform notes and the raw commands behind the cross-platform shortcuts.
notes: os-notes windows-notes linux-notes

# Show the operating system family seen by just.
os-notes:
    @echo "just sees os={{ os() }} os_family={{ os_family() }}"
    @echo "Recipes run from the repository root, even when invoked from a subdirectory."

# Linux/macOS notes.
linux-notes:
    @echo "Linux/macOS: recipes use the default sh-compatible shell; dev recipes use bash for process cleanup."
    @echo "Install tools if needed: just, uv, pnpm, plus backend services from backend/.env.example (Postgres, RabbitMQ, Redis)."

# Windows notes.
windows-notes:
    @echo "Windows: prefer WSL for parity with Linux. Git Bash also works if sh/bash are in PATH."
    @echo "Native PowerShell differs in quoting, path separators, and signal/process handling."
    @echo "PowerShell equivalents: cd backend; uv sync --all-groups | cd frontend; pnpm install"
    @echo "PowerShell dev needs separate terminals: backend fastapi, frontend pnpm dev, and optionally celery."

# Install backend and frontend dependencies.
install: backend-sync frontend-install

# Run all fast local checks that do not require external services.
check: backend-check frontend-check

# Start FastAPI and Vite together for local UI development.
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT INT TERM
    (cd {{ backend }} && uv run fastapi dev src/app/main.py --host {{ host }} --port {{ api_port }}) &
    (cd {{ frontend }} && pnpm dev --host {{ host }} --port {{ ui_port }}) &
    wait

# Start FastAPI, Vite, and a Celery worker together.
dev-all:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT INT TERM
    (cd {{ backend }} && uv run fastapi dev src/app/main.py --host {{ host }} --port {{ api_port }}) &
    (cd {{ backend }}/src && uv run celery -A {{ celery_app }} worker --loglevel=INFO) &
    (cd {{ frontend }} && pnpm dev --host {{ host }} --port {{ ui_port }}) &
    wait

# -------------------------
# Backend: uv / FastAPI / Celery / ruff / ty / crawl4ai
# -------------------------

# Run an arbitrary uv command in backend, e.g. `just uv add httpx`.
uv *args:
    cd {{ backend }} && uv {{ args }}

# Sync backend dependencies including dev/lint/test groups.
backend-sync:
    cd {{ backend }} && uv sync --all-groups

# Update backend lockfile and environment.
backend-update:
    cd {{ backend }} && uv sync --all-groups --upgrade

# Run the FastAPI dev server with reload.
backend-dev:
    cd {{ backend }} && uv run fastapi dev src/app/main.py --host {{ host }} --port {{ api_port }}

# Alias for `backend-dev`.
fastapi: backend-dev

# Run FastAPI in non-reload mode.
backend-run:
    cd {{ backend }} && uv run fastapi run src/app/main.py --host {{ host }} --port {{ api_port }}

# Run the Celery worker.
celery:
    cd {{ backend }}/src && uv run celery -A {{ celery_app }} worker --loglevel=INFO

# Run the Celery beat scheduler.
celery-beat:
    cd {{ backend }}/src && uv run celery -A {{ celery_app }} beat --loglevel=INFO

# Run ruff lint checks.
backend-ruff:
    cd {{ backend }} && uv run ruff check .

# Format backend code with ruff.
backend-format:
    cd {{ backend }} && uv run ruff format .

# Alias for `backend-ruff`.
ruff: backend-ruff

# Run ty type checks.
backend-ty:
    cd {{ backend }} && uv run ty check .

# Alias for `backend-ty`.
ty: backend-ty

# Run backend tests.
backend-test:
    cd {{ backend }} && uv run pytest

# Run backend lint, type checks, and tests.
backend-check: backend-ruff backend-ty backend-test

# Install Crawl4AI browser/database assets.
crawl4ai-setup:
    cd {{ backend }} && uv run crawl4ai-setup

# Run Crawl4AI health checks.
crawl4ai-doctor:
    cd {{ backend }} && uv run crawl4ai-doctor

# -------------------------
# Frontend: pnpm / Vite / TypeScript / ESLint / Playwright
# -------------------------

# Run an arbitrary pnpm command in frontend, e.g. `just pnpm add zod`.
pnpm *args:
    cd {{ frontend }} && pnpm {{ args }}

# Install frontend dependencies.
frontend-install:
    cd {{ frontend }} && pnpm install

# Start the Vite dev server.
frontend-dev:
    cd {{ frontend }} && pnpm dev --host {{ host }} --port {{ ui_port }}

# Build frontend production assets.
frontend-build:
    cd {{ frontend }} && pnpm build

# Run frontend ESLint.
frontend-lint:
    cd {{ frontend }} && pnpm lint

# Type-check frontend with TypeScript. TSLint itself is deprecated and is not a project dependency.
frontend-tslint:
    cd {{ frontend }} && pnpm exec tsc -b --noEmit

# Alias for TypeScript type checking; this project does not use the deprecated tslint package.
tslint: frontend-tslint

# Run frontend unit tests.
frontend-test:
    cd {{ frontend }} && pnpm test

# Run frontend Playwright end-to-end tests.
frontend-e2e:
    cd {{ frontend }} && pnpm test:e2e

# Run frontend lint, type checks, and unit tests.
frontend-check: frontend-lint frontend-tslint frontend-test
