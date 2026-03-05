#!/usr/bin/env python3
import sqlite3
from pathlib import Path

BASE = Path(__file__).resolve().parent
DB_PATH = BASE / "inventory.db"

schema = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    service TEXT,
    purpose TEXT NOT NULL,
    environment TEXT CHECK(environment IN ('prod','staging','dev','local','other')) DEFAULT 'other',
    secret_reference TEXT NOT NULL,
    owner TEXT,
    rotation_interval_days INTEGER,
    last_rotated_at TEXT,
    expires_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    source TEXT CHECK(source IN ('local','openclaw','clawhub','other')) DEFAULT 'other',
    location TEXT,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK(is_enabled IN (0,1)),
    version TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT CHECK(category IN ('cli','api','internal','other')) DEFAULT 'other',
    provider TEXT,
    purpose TEXT,
    requires_auth INTEGER NOT NULL DEFAULT 0 CHECK(requires_auth IN (0,1)),
    docs_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_api_keys_updated_at
AFTER UPDATE ON api_keys
FOR EACH ROW
BEGIN
    UPDATE api_keys SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_skills_updated_at
AFTER UPDATE ON skills
FOR EACH ROW
BEGIN
    UPDATE skills SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_tools_updated_at
AFTER UPDATE ON tools
FOR EACH ROW
BEGIN
    UPDATE tools SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
"""

seed_data = [
    """
    INSERT OR IGNORE INTO tools (name, category, provider, purpose, requires_auth, docs_url)
    VALUES
      ('read', 'internal', 'OpenClaw', 'Dateien lesen', 0, 'https://docs.openclaw.ai'),
      ('write', 'internal', 'OpenClaw', 'Dateien schreiben', 0, 'https://docs.openclaw.ai'),
      ('edit', 'internal', 'OpenClaw', 'Dateien gezielt bearbeiten', 0, 'https://docs.openclaw.ai'),
      ('exec', 'internal', 'OpenClaw', 'Shell-Kommandos ausführen', 0, 'https://docs.openclaw.ai'),
      ('web_search', 'internal', 'Brave/OpenClaw', 'Websuche', 0, 'https://docs.openclaw.ai'),
      ('web_fetch', 'internal', 'OpenClaw', 'Webseite extrahieren', 0, 'https://docs.openclaw.ai');
    """,
    """
    INSERT OR IGNORE INTO skills (name, description, source, location, is_enabled)
    VALUES
      ('gog', 'Google Workspace CLI für Gmail/Calendar/Drive/etc.', 'openclaw', '/usr/lib/node_modules/openclaw/skills/gog/SKILL.md', 1),
      ('notion', 'Notion API für Seiten, Datenbanken und Blöcke', 'local', '~/.openclaw/workspace/skills/notion/SKILL.md', 1),
      ('weather', 'Wetter und Forecasts über wttr.in/Open-Meteo', 'openclaw', '/usr/lib/node_modules/openclaw/skills/weather/SKILL.md', 1);
    """
]

def main() -> None:
    BASE.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(schema)
        for q in seed_data:
            conn.executescript(q)
        conn.commit()
    finally:
        conn.close()

    print(f"✅ Inventory-Datenbank bereit: {DB_PATH}")

if __name__ == "__main__":
    main()
