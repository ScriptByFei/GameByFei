#!/bin/bash
set -euo pipefail

# TrueRecall Skill - Search Wrapper
# Usage: ./recall.sh "search query"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TRUERECALL_DIR="/home/masgi_bot/apps/openclaw-true-recall-base"
SEARCH_SCRIPT="$TRUERECALL_DIR/scripts/search_q.sh"
ENV_FILE="/home/masgi_bot/.config/true-recall.env"

# Check if TrueRecall is installed
if [[ ! -f "$SEARCH_SCRIPT" ]]; then
    echo "Error: TrueRecall not found at $TRUERECALL_DIR" >&2
    echo "Please install TrueRecall Base first." >&2
    exit 1
fi

# Check env file
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: Config missing at $ENV_FILE" >&2
    exit 1
fi

# Load environment
set -a
source "$ENV_FILE"
set +a

# Validate OpenAI key
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
    echo "Error: OPENAI_API_KEY not set in $ENV_FILE" >&2
    exit 1
fi

# Parse arguments
QUERY="${*:-}"
if [[ -z "$QUERY" ]]; then
    echo "Usage: $0 \"search query\"" >&2
    exit 1
fi

# Export for search_q.py
export OPENAI_API_KEY
export QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"
export QDRANT_COLLECTION="${QDRANT_COLLECTION:-memories_tr}"
export USER_ID="${USER_ID:-fei89}"

# Run search
exec python3 "$TRUERECALL_DIR/scripts/search_q.py" "$QUERY"