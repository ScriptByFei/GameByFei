# Inventory-Datenbank

Diese lokale Datenbank hilft dir, **API-Keys (ohne Klartext-Keys)**, Skills und Tools zentral zu verwalten.

## Speicherort

- DB-Datei: `inventory/inventory.db`
- Initialisierungs-Skript: `inventory/init_inventory_db.py`

## Was wird gespeichert?

### 1) API Keys (`api_keys`)
Nur Metadaten, **niemals der Key selbst**:
- Anbieter
- Zweck
- Service/Produkt
- Environment (prod/dev/local)
- Gültig? Rotationsdatum? Notizen
- Wo der Secret liegt (z. B. `1Password: Vault/Item`)

### 2) Skills (`skills`)
- Name
- Beschreibung
- Quelle (local/openclaw/clawhub)
- Pfad
- Aktiv-Status
- Version

### 3) Tools (`tools`)
- Name
- Kategorie (cli/api/internal/other)
- Anbieter
- Zweck
- Zugriff nötig?
- Dokumentations-Link

## Schnellstart

```bash
python3 inventory/init_inventory_db.py
```

Danach kannst du mit jedem SQLite-Viewer auf `inventory/inventory.db` zugreifen (z. B. DB Browser for SQLite, DBeaver etc.).

## Beispielabfragen

```sql
-- Alle aktiven API-Key-Einträge
SELECT provider, service, purpose, environment, secret_reference
FROM api_keys
WHERE is_active = 1
ORDER BY provider, service;

-- Alle Skills
SELECT name, source, is_enabled, version
FROM skills
ORDER BY name;

-- Tools nach Kategorie
SELECT category, name, provider, purpose
FROM tools
ORDER BY category, name;
```

## Sicherheit

- Keine Klartext-Secrets in der Datenbank speichern.
- Nur Referenzen auf Secret Manager (1Password, Bitwarden, env var Namen, etc.).
- Wenn du aus Versehen einen Key eingetragen hast: sofort rotieren und löschen.
