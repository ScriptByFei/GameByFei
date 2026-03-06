# Session: 2026-03-06 00:28:45 UTC

- **Session Key**: agent:main:telegram:direct:1831255989
- **Session ID**: e9dca8b7-0647-42a9-a991-44e0ccdf85d5
- **Source**: telegram

## Conversation Summary

assistant: [[reply_to_current]] Alles klar — schauen wir, wo das Modell gepinnt wird. Ich prüfe die Config:
assistant: [[reply_to_current]] Ich sehe das Problem. Die Config hat Kimi als `primary` gesetzt, aber Codex ist in den `fallbacks` und wurde offenbar beim Start genutzt. Lass mich prüfen, ob es eine Entry-Config gibt die das überschreibt:
assistant: [[reply_to_current]] Die Agent-Config ist korrekt (nur Kimi). Das Problem ist, dass beim Start irgendwo ein Override auf Codex gesetzt wird — wahrscheinlich als Session-Default oder durch den Start-Befehl.

Ich setze jetzt den Agent-Default explizit auf Kimi und entferne den Fallback auf Codex:
assistant: [[reply_to_current]] Fallbacks entfernt. Für den vollständigen Fix muss wahrscheinlich auch der **Start-Befehl** angepasst werden, falls dort explizit Codex gepinnt ist.

Wie startest du den Agenten? 
- Systemd-Service?
- `openclaw` CLI direkt?
- Docker?

Dann können wir das Modell-Argument anpassen oder entfernen.
user: Wie meinst du das, der läuft 24/7
assistant: [[reply_to_current]] Verstehe — dann schauen wir wie er läuft:
assistant: [[reply_to_current]] Ich sehe `openclaw-gateway` läuft als Prozess. Lass mich das Startskript/Dienstkonfig prüfen:
assistant: [[reply_to_current]] Service-File gefunden. Das Gateway wird so gestartet:

```
ExecStart=/usr/bin/node /usr/lib/node_modules/openclaw/dist/index.js gateway --port 18789
```

Das Modell wird nicht hier übergeben — es wird beim **Agent-Connect** oder in der **Gateway-Config** gesetzt. Ich prüfe wo Codex als Default herkommt:
assistant: [[reply_to_current]] **Gefunden!** Das Problem liegt in `sessions.json` — da ist `gpt-5.3-codex` als Session-Default gepinnt. Schau:
assistant: [[reply_to_current]] Ich sehe es jetzt klar. Die Session `agent:main:main` hat Codex als Default gepinnt:

```json
"agent:main:main": {
  "authProfileOverride": "openai-codex:default",
  "modelProvider": "openai-codex",
  "model": "gpt-5.3-codex",
  ...
}
```

Das ist der "Fallback" für neue Sessions. Ich ändere das auf Kimi:
assistant: [[reply_to_current]] Gut. Jetzt entferne ich die alten Codex-Einträge weiter unten in derselben Session:
assistant: [[reply_to_current]] Gut. Jetzt noch das `systemPromptReport` anpassen:
assistant: [[reply_to_current]] Main-Session ist jetzt auf Kimi umgestellt. Soll ich auch die Cron-Jobs umstellen? Die laufen aktuell noch auf Codex:

- `watch-openclaw-release-exec-fixes`
- `reminder-gog-and-ollama-setup`
user: Geht nicht?
assistant: [[reply_to_current]] Doch, geht. Aber **wirksam wird es erst bei der nächsten neuen Session** — die aktuelle läuft noch auf dem Modell, mit dem sie gestartet wurde.

Test: Beim nächsten `/new` oder `/reset` sollte Kimi als Default greifen.

Die Cron-Jobs laufen immer noch auf Codex — die könnte ich auch umstellen, aber dann verlieren sie ihren aktuellen State.

Was meinst du?
