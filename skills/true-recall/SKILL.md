---
name: true-recall
description: Semantic memory search over past OpenClaw conversations using Qdrant vector database. Use when the user asks about past conversations, previous decisions, things discussed earlier, or references like "erinnerst du dich", "wie hatten wir das gemacht", "letztes mal", "vorhin gesagt", "status von", "was war mit", or any query requiring historical context from prior sessions.
---

# TrueRecall Skill

Search your semantic memory archive (Qdrant) for relevant past conversations.

## Prerequisites

This skill requires TrueRecall Base to be installed and running:
- Qdrant instance (local or remote)
- `memories_tr` collection with OpenAI embeddings
- Environment config at `~/.config/true-recall.env` with `OPENAI_API_KEY`

## Usage

The user triggers this skill by asking about past conversations. Examples:
- "Erinnerst du dich an Mission Control?"
- "Was haben wir gestern zu Codex besprochen?"
- "Wie war das mit dem Backup?"
- "Status von Docker-Deployment"

## Workflow

1. Extract the core search query from the user's message
2. Execute `scripts/recall.sh` with the query
3. Present results in a clear format

## Output Format

Results include:
- Relevance score (0.0-1.0)
- Timestamp of original conversation
- Speaker role (user/assistant)
- Content snippet (truncated for readability)

If no relevant results found, say so plainly.

## Result Limits

- Default: 8 results
- Min score threshold: 0.35 (filter out noise)
- Max snippet length: 260 chars

## Implementation

Execute: `./scripts/recall.sh "<user query>"`

This calls the TrueRecall search pipeline which:
1. Generates OpenAI embedding for the query
2. Searches Qdrant `memories_tr` collection
3. Returns matching conversation turns ranked by similarity