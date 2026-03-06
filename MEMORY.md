# MEMORY.md - Long-Term Memory

## Preferences & Decisions

- 2026-03-04: fei requested **no OpenClaw updates** for now. Reason: recent newer updates caused issues, especially with `exec:` not working reliably. Do not update OpenClaw until this is confirmed fixed.
- 2026-03-05: For Google CLI (`gog`), keyring password location is `~/.config/openclaw/gog.env`. In new sessions, load env from there before `gog` commands requiring auth unlock.
- 2026-03-06: fei wants Mission Control as the primary task hub with continuous sync from chat. `Task:` commands in chat should be mirrored to Mission Control automatically; keep task state in sync and use heartbeat checks for ongoing integrity.
