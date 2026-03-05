# API / Skills / Tools Inventar

> **Wichtig:** Keine API-Keys im Klartext eintragen.
> Nur Metadaten + Secret-Referenz (z. B. 1Password, Bitwarden, ENV-Name).

## API-Zugänge

| Anbieter | Secret-Referenz (kein Klartext) | Letzte Rotation | Status |
|---|---|---|---|
| _Beispiel: OpenAI_ | _1Password: API/OpenAI_ | _2026-01-01_ | _aktiv_ |

## Skills

| Name | Beschreibung | Quelle (local/openclaw/clawhub) | Pfad/Link | Aktiv | Version | Notiz |
|---|---|---|---|---|---|---|
| gog | Google Workspace CLI für Gmail/Calendar/Drive/etc. | openclaw | /usr/lib/node_modules/openclaw/skills/gog/SKILL.md | ja | - | - |
| notion | Notion API für Seiten, Datenbanken und Blöcke | local | ~/.openclaw/workspace/skills/notion/SKILL.md | ja | - | - |
| weather | Wetter und Forecasts über wttr.in/Open-Meteo | openclaw | /usr/lib/node_modules/openclaw/skills/weather/SKILL.md | ja | - | - |

## Tools

| Name | Kategorie | Anbieter | Zweck | Auth nötig | Doku | Notiz |
|---|---|---|---|---|---|---|
| read | internal | OpenClaw | Dateien lesen | nein | https://docs.openclaw.ai | - |
| write | internal | OpenClaw | Dateien schreiben | nein | https://docs.openclaw.ai | - |
| edit | internal | OpenClaw | Dateien gezielt bearbeiten | nein | https://docs.openclaw.ai | - |
| exec | internal | OpenClaw | Shell-Kommandos ausführen | nein | https://docs.openclaw.ai | - |
| web_search | internal | Brave/OpenClaw | Websuche | nein | https://docs.openclaw.ai | - |
| web_fetch | internal | OpenClaw | Webseite extrahieren | nein | https://docs.openclaw.ai | - |

## Änderungslog

| Datum | Änderung |
|---|---|
| 2026-03-05 | Datei erstellt |
