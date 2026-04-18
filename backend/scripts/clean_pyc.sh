#!/bin/bash

# This script removes all Python bytecode files (.pyc) and __pycache__ directories from the current directory and its subdirectories.
# Pytest generates .pyc files by default, and this script helps to clean them up.
echo "Cleaning Python bytecode files..."
find . -type f -name "*.pyc" -delete
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
echo "Done!"