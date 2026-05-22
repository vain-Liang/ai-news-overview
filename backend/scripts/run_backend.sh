#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
VENV_PYTHON="$ROOT_DIR/.venv/bin/python"

HOST="${BACKEND_HOST:-127.0.0.1}"
PORT="${BACKEND_PORT:-8000}"
RELOAD=1
RUN_MIGRATIONS=0
START_BACKEND=1
START_CELERY=0
CELERY_LOGLEVEL="${CELERY_LOGLEVEL:-info}"
CELERY_QUEUE="${CELERY_QUEUE:-}"
UVICORN_EXTRA_ARGS=()
CELERY_EXTRA_ARGS=()
PIDS=()

usage() {
    cat <<'USAGE'
Usage: scripts/run_backend.sh [options] [-- <extra uvicorn args>]
       scripts/run_backend.sh --celery-only [options] [--celery <extra celery args>]

Quickly boot the backend and optionally start the Celery worker.

Options:
  --host <host>              Bind host (default: 127.0.0.1 or BACKEND_HOST)
  --port <port>              Bind port (default: 8000 or BACKEND_PORT)
  --reload                   Enable auto-reload (default)
  --no-reload                Disable auto-reload
  --migrate                  Run alembic upgrade head before starting backend
  --with-celery              Start backend and Celery worker together
  --celery-only              Start only the Celery worker
  --celery-loglevel <level>  Celery log level (default: info or CELERY_LOGLEVEL)
  --celery-queue <name>      Restrict worker to a specific queue
  --celery                   Treat remaining args as extra celery worker args
  -h, --help                 Show this help message

Examples:
  scripts/run_backend.sh
  scripts/run_backend.sh --migrate
  scripts/run_backend.sh --with-celery
  scripts/run_backend.sh --celery-only
  scripts/run_backend.sh --with-celery --celery-loglevel debug
  scripts/run_backend.sh --host 0.0.0.0 --port 8080 -- --log-level debug
  scripts/run_backend.sh --celery-only --celery --concurrency 2
USAGE
}

cleanup() {
    local exit_code=$?

    if [[ ${#PIDS[@]} -gt 0 ]]; then
        for pid in "${PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done

        wait "${PIDS[@]}" 2>/dev/null || true
    fi

    exit "$exit_code"
}

select_runner() {
    if [[ -x "$VENV_PYTHON" ]]; then
        RUNNER=("$VENV_PYTHON")
    else
        RUNNER=(uv run python)
    fi
}

start_backend() {
    local cmd=("${RUNNER[@]}" -m uvicorn app.main:app --host "$HOST" --port "$PORT")

    if [[ "$RELOAD" -eq 1 ]]; then
        cmd+=(--reload)
    fi

    if [[ ${#UVICORN_EXTRA_ARGS[@]} -gt 0 ]]; then
        cmd+=("${UVICORN_EXTRA_ARGS[@]}")
    fi

    echo "==> Starting backend"
    echo "    URL: http://$HOST:$PORT"
    echo "    Health: http://$HOST:$PORT/healthz"

    if [[ "$START_CELERY" -eq 1 ]]; then
        "${cmd[@]}" &
        PIDS+=("$!")
        return
    fi

    exec "${cmd[@]}"
}

start_celery() {
    local cmd=(
        "${RUNNER[@]}" -m celery -A app.tasks.celery_app:celery_app worker
        --loglevel "$CELERY_LOGLEVEL"
        --without-mingle
        --without-gossip
        --without-heartbeat
    )

    if [[ -n "$CELERY_QUEUE" ]]; then
        cmd+=(--queues "$CELERY_QUEUE")
    fi

    if [[ ${#CELERY_EXTRA_ARGS[@]} -gt 0 ]]; then
        cmd+=("${CELERY_EXTRA_ARGS[@]}")
    fi

    echo "==> Starting Celery worker"
    echo "    App: app.tasks.celery_app:celery_app"
    echo "    Log level: $CELERY_LOGLEVEL"
    if [[ -n "$CELERY_QUEUE" ]]; then
        echo "    Queue: $CELERY_QUEUE"
    fi

    if [[ "$START_BACKEND" -eq 1 ]]; then
        "${cmd[@]}" &
        PIDS+=("$!")
        return
    fi

    exec "${cmd[@]}"
}

MODE="uvicorn"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --host)
            HOST="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --reload)
            RELOAD=1
            shift
            ;;
        --no-reload)
            RELOAD=0
            shift
            ;;
        --migrate)
            RUN_MIGRATIONS=1
            shift
            ;;
        --with-celery)
            START_CELERY=1
            START_BACKEND=1
            shift
            ;;
        --celery-only)
            START_CELERY=1
            START_BACKEND=0
            RELOAD=0
            shift
            ;;
        --celery-loglevel)
            CELERY_LOGLEVEL="$2"
            shift 2
            ;;
        --celery-queue)
            CELERY_QUEUE="$2"
            shift 2
            ;;
        --celery)
            MODE="celery"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        --)
            shift
            if [[ "$MODE" == "celery" ]]; then
                CELERY_EXTRA_ARGS+=("$@")
            else
                UVICORN_EXTRA_ARGS+=("$@")
            fi
            break
            ;;
        *)
            if [[ "$MODE" == "celery" ]]; then
                CELERY_EXTRA_ARGS+=("$1")
            else
                UVICORN_EXTRA_ARGS+=("$1")
            fi
            shift
            ;;
    esac
done

if [[ "$START_BACKEND" -eq 0 && "$RUN_MIGRATIONS" -eq 1 ]]; then
    echo "--migrate requires backend startup. Use it with default mode or --with-celery." >&2
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing $ENV_FILE. Copy .env.example to .env before starting the backend." >&2
    exit 1
fi

cd "$ROOT_DIR"
export PYTHONPATH="$ROOT_DIR/src${PYTHONPATH:+:$PYTHONPATH}"

select_runner
trap cleanup EXIT INT TERM

if [[ "$RUN_MIGRATIONS" -eq 1 ]]; then
    echo "==> Running database migrations"
    "${RUNNER[@]}" -m alembic upgrade head
fi

if [[ "$START_BACKEND" -eq 1 ]]; then
    start_backend
fi

if [[ "$START_CELERY" -eq 1 ]]; then
    start_celery
fi

if [[ "$START_BACKEND" -eq 1 && "$START_CELERY" -eq 1 ]]; then
    wait -n "${PIDS[@]}"
fi
