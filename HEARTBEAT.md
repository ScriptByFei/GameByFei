# HEARTBEAT.md

## Mission Control Sync (always-on)

On each heartbeat, do this in order:

1) **Health check**
- Verify Mission Control frontend/backend are reachable:
  - `http://192.168.178.164:3000`
  - `http://192.168.178.164:8000/healthz`
- If unhealthy: notify user with a short fix suggestion.

2) **Task sync integrity**
- Confirm `Main Board` exists.
- Check for recent tasks with title prefix `Task:` or created from Telegram sync.
- If a task action was completed outside dashboard (e.g., calendar event done), update task status/comment accordingly.

3) **Stuck task review**
- Find tasks in `in_progress`/`review` older than 24h.
- Send one concise digest only if there are stuck tasks.

4) **Noise control**
- If nothing changed since last heartbeat check, reply `HEARTBEAT_OK`.

## Chat-to-Task contract

When user writes:
- `Task: <text>` -> create task in Mission Control (`Main Board`, medium priority).
- `Task run: <text>` -> create task + spawn subagent execution; set status `in_progress`.
- `Task run [agent=<name>]: <text>` -> same, but prefer a specific execution profile.
- `Task start: <text>` -> set matching task to `in_progress`.
- `Task done: <text>` -> set matching task to `done` (or `review` if board policy blocks done).
- `Task blockiert: <text>` -> set matching task to `review` with block comment.

For `Task run*`:
- Post subagent progress/result back as a task comment.
- On success -> `done`; on failure -> `review` with error summary.

Always confirm with Task ID in the reply.
