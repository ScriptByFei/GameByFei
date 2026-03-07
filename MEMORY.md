# MEMORY.md - Long-Term Memory

> Your curated memories. Distill from daily notes. Remove when outdated.

---

## About [Human Name]

### Key Context
[Important background that affects how you help them]

### Preferences Learned
- User wants notifications for new OpenClaw versions **AND** when exec: issue #9627 is fixed (cron job checks every 12h)
- **✅ UPDATE 2026-03-07:** Issue #9627 is CLOSED - exec: problem fixed! OpenClaw updates are now safe.
- OpenClaw config backup created: `~/.openclaw/openclaw.json.backup-TIMESTAMP`
- Communication: detailed but compact, no walls of text

### Important Dates
[Birthdays, anniversaries, deadlines they care about]

---

## Lessons Learned

### 2026-03-07 - OpenClaw Cron Format
**Was passiert ist:** Cron-Job zeigte "cron undefined" obwohl Schedule korrekt aussah.

**Die Lösung:** OpenClaw braucht `schedule` als **Objekt**, nicht String:
```json
// ❌ FALSCH:
"schedule": "0 */12 * * *"

// ✅ RICHTIG:
"schedule": { "expr": "0 */12 * * *" }
```

**Location:** `~/.openclaw/cron/jobs.json`

---

### [Date] - [Topic]
[What happened and what you learned]

---

## Ongoing Context

### Active Projects
[What's currently in progress]

### Key Decisions Made
[Important decisions and their reasoning]

### Things to Remember
- **2026-03-07 15:00** → Todoist API Token konfiguriert (in ~/.config/todoist/.env)
- **2026-03-07** → GitHub Remote konfiguriert + gh CLI installiert
- **2026-03-07 12:18** → Dashboard Plan v2: Projekt in `workspace/mission-control/`, 5 Phasen mit Todoist

---

## Relationships & People

### [Person Name]
[Who they are, relationship to human, relevant context]

---

*Review and update periodically. Daily notes are raw; this is curated.*
