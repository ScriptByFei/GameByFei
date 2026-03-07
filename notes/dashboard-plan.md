# Dashboard Projekt: Mission Control Variante

> MVP Dashboard für Task-Management mit OpenClaw Integration

---

## 🎯 Ziel

Ein schlankes Kanban-Dashboard bauen:
- 3 Spalten: **Todo** | **In Progress** | **Done**
- Tasks via UI und via OpenClaw API erstellen
- SQLite als lokale Datenbank
- Next.js 14 + TypeScript

---

## 🛠️ Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | SQLite (better-sqlite3 oder prisma) |
| State | React Context oder Zustand |
| Icons | Lucide React |
| API | Next.js API Routes |

---

## ✨ Features (MVP)

### Core
- [ ] Task erstellen (Titel, Beschreibung, Priorität)
- [ ] Tasks zwischen Spalten verschieben (Drag & Drop)
- [ ] Tasks bearbeiten/löschen
- [ ] SQLite Persistenz

### OpenClaw Integration
- [ ] POST /api/tasks - OpenClaw kann Tasks erstellen
- [ ] GET /api/tasks - Liste abrufen
- [ ] PATCH /api/tasks/[id] - Status updaten (für "In Progress" / "Done")

### UI
- [ ] Clean Kanban Board
- [ ] Task Cards mit Prioritäts-Farben
- [ ] Simple Form für neue Tasks
- [ ] Responsive (Mobile-fähig)

---

## 🗄️ Datenbank Schema

```sql
-- Tasks Tabelle
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  priority INTEGER CHECK(priority IN (1, 2, 3, 4)) DEFAULT 2, -- 1=low, 4=urgent
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Für spätere Erweiterung
CREATE TABLE task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  from_status TEXT,
  to_status TEXT,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

---

## 🔌 API Endpoints

| Methode | Route | Beschreibung |
|---------|-------|--------------|
| GET | /api/tasks | Alle Tasks abrufen |
| POST | /api/tasks | Neuen Task erstellen |
| PATCH | /api/tasks/[id] | Task updaten (Status, Titel, etc.) |
| DELETE | /api/tasks/[id] | Task löschen |

### OpenClaw Integration

OpenClaw kann über HTTP Requests Task erstellen:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Einkaufen gehen","status":"todo","priority":3}'
```

---

## 📱 UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│  🚀 Mission Control Dashboard          [+ Neue Task]   │
├─────────────────────────────────────────────────────────┤
│  📋 Todo        │  ⚡ In Progress   │  ✅ Done         │
│                 │                    │                   │
│ ┌───────────┐   │  ┌───────────┐    │  ┌───────────┐   │
│ │ 🛒        │   │  │ 💻        │    │  │ 📧        │   │
│ │ Einkaufen │   │  │ Dashboard │    │  │ Email     │   │
│ │ P3        │   │  │ bauen     │    │  │ erledigt  │   │
│ └───────────┘   │  └───────────┘    │  └───────────┘   │
│                 │                    │                   │
│ ┌───────────┐   │                    │                   │
│ │ 🔧        │   │                    │                   │
│ │ Setup     │   │                    │                   │
│ │ P2        │   │                    │                   │
│ └───────────┘   │                    │                   │
│                 │                    │                   │
└─────────────────────────────────────────────────────────┘
```

**Drag & Drop:** Karte von Todo → In Progress → Done ziehen

---

## 🔗 OpenClaw Verbindung

### Szenario 1: Task erstellen
**User:** "Erstelle Task: Docker Container debuggen"

**OpenClaw macht:**
```javascript
fetch('http://localhost:3000/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Docker Container debuggen',
    status: 'todo',
    priority: 3
  })
});
```

**Antwort:** "✅ Task erstellt: Docker Container debuggen"

### Szenario 2: Tasks anzeigen
**User:** "Zeig meine offenen Tasks"

**OpenClaw macht:**
```javascript
fetch('http://localhost:3000/api/tasks?status=todo')
```

**Antwort:** "📋 3 offene Tasks: 1. Einkaufen, 2. Docker debuggen, 3. ..."

---

## 📁 Projektstruktur

**Pfad:** `~/.openclaw/workspace/mission-control/`

```
~/.openclaw/workspace/
├── mission-control/              # Projekt Ordner
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       ├── route.ts      # GET/POST
│   │   │       └── [id]/
│   │   │           └── route.ts  # PATCH/DELETE
│   │   ├── page.tsx              # Kanban Board
│   │   ├── layout.tsx            # Root Layout
│   │   └── globals.css           # Tailwind
│   ├── components/
│   │   ├── KanbanBoard.tsx       # Main Board
│   │   ├── TaskCard.tsx          # Einzelne Karte
│   │   ├── TaskColumn.tsx        # Spalte (Todo/InProgress/Done)
│   │   └── NewTaskModal.tsx      # Form für neue Tasks
│   ├── lib/
│   │   └── db.ts                 # SQLite Connection
│   ├── data/
│   │   └── mission-control.sqlite # Datenbank
│   ├── package.json
│   └── next.config.js
└── .gitignore                    # mission-control/ ignorieren (optional)
```

---

## 🚀 Roadmap (Phasen)

### Phase 1: Setup & DB (1-2h)
```
Pfad: ~/.openclaw/workspace/mission-control/
```
- [ ] Next.js Projekt initialisieren (im Workspace)
- [ ] SQLite einrichten (better-sqlite3)
- [ ] Datenbank-Schema erstellen
- [ ] `.gitignore` aktualisieren (node_modules, *.sqlite)

### Phase 2: Backend API (2-3h)
- [ ] API Routes implementieren
- [ ] CRUD Operations testen (curl/Postman)

### Phase 3: Frontend UI (3-4h)
- [ ] Kanban Board Komponenten
- [ ] Task Cards mit Styling
- [ ] Drag & Drop (react-beautiful-dnd oder @dnd-kit)

### Phase 4: OpenClaw Integration (1h)
- [ ] API Endpoints für OpenClaw dokumentieren
- [ ] Skill/Config erstellen für OpenClaw Requests

### Phase 5: Polish (1h)
- [ ] Error Handling
- [ ] Loading States
- [ ] Mobile Responsive

**Gesamt:** ~8-12h Arbeit

---

## 📝 Nächste Schritte

1. In das Workspace Verzeichnis wechseln
2. Next.js Projekt erstellen: `npx create-next-app@latest mission-control --typescript --tailwind --app`
3. In `mission-control/` wechseln und SQLite einrichten
4. API bauen
5. UI bauen

**Oder alle Schritte auf einmal mit Codex:**

```bash
cd ~/.openclaw/workspace
npx create-next-app@latest mission-control --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd mission-control
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

**Wichtig:** `mission-control/` zu `.gitignore` hinzufügen (Node modules), nur Source-Code committen:

```bash
echo "mission-control/node_modules/" >> ~/.openclaw/workspace/.gitignore
echo "mission-control/data/*.sqlite" >> ~/.openclaw/workspace/.gitignore
```

**Bereit zum Starten mit Codex?** 🚀
