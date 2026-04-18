#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPS_ROOT="$HOME/.local/playwright-deps/root"
LIB_PATHS=(
  "$DEPS_ROOT/usr/lib/x86_64-linux-gnu"
  "$DEPS_ROOT/lib/x86_64-linux-gnu"
  "$DEPS_ROOT/usr/lib"
  "$DEPS_ROOT/lib"
)

LD_LIBRARY_PATH="$(IFS=:; echo "${LIB_PATHS[*]}")${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export LD_LIBRARY_PATH
export FONTCONFIG_PATH="$DEPS_ROOT/etc/fonts"
export FONTCONFIG_FILE="$DEPS_ROOT/etc/fonts/fonts.conf"
export FONTCONFIG_SYSROOT="$DEPS_ROOT"
export XDG_DATA_DIRS="$DEPS_ROOT/usr/share${XDG_DATA_DIRS:+:$XDG_DATA_DIRS}"

cd "$ROOT_DIR"
exec playwright test "$@"
