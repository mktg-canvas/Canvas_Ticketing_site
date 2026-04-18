#!/bin/sh
# Run once after `git init` to activate the post-commit hook
git config core.hooksPath .githooks
echo "✓ Git hooks activated — dev-memory.md will auto-update after every commit"
