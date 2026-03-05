#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/home/masgi_bot/.openclaw/workspace}"

if command -v tree >/dev/null 2>&1; then
  tree -a -L 2 \
    -I '.git|node_modules|.clawhub|404|skills-lock.json|BOOTSTRAP.md|TOOLS.md|IDENTITY.md|memory/*.md|*.log' \
    "$ROOT"
else
  find "$ROOT" -maxdepth 2 \
    -not -path '*/.git*' \
    -not -path '*/node_modules*' \
    -not -path '*/.clawhub*' \
    | sed "s|$ROOT|.|" | sort
fi
