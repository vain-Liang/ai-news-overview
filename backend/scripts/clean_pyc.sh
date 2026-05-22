#!/bin/bash

# This script removes all Python bytecode files (.pyc) and __pycache__ directories from the current directory and its subdirectories.
# Pytest generates .pyc files by default, and this script helps to clean them up.
# the location of the script should be 'backend/scripts'.
# script should be run from the 'backend/scripts' directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$(basename "$(dirname "$SCRIPT_DIR")")" != "backend" ] || [ "$(basename "$SCRIPT_DIR")" != "scripts" ]; then
    echo "Error: this script must live in 'backend/scripts'." >&2
    exit 1
fi

if [ "$(pwd)" != "$SCRIPT_DIR" ]; then
    echo "Error: this script must be run from 'backend/scripts'." >&2
    echo "Current directory: $(pwd)" >&2
    exit 1
fi

BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
echo "Cleaning Python bytecode files in $BACKEND_DIR..."
find "$BACKEND_DIR" -type f -name "*.pyc" -delete
find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
echo "Done!"