# OpenClaw Model-Setup Varianten

## 1) Lokal primär, Codex als Fallback (empfohlen für deinen aktuellen Use-Case)

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "vllm/kimi-k2.5:cloud",
        "fallbacks": [
          "openai-codex/gpt-5.3-codex"
        ]
      },
      "models": {
        "vllm/kimi-k2.5:cloud": {},
        "openai-codex/gpt-5.3-codex": {}
      }
    }
  },
  "auth": {
    "profiles": {
      "openai-codex:default": {
        "provider": "openai-codex",
        "mode": "oauth"
      }
    }
  }
}
```

## 2) Codex primär, lokal als Fallback

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai-codex/gpt-5.3-codex",
        "fallbacks": [
          "vllm/kimi-k2.5:cloud"
        ]
      },
      "models": {
        "openai-codex/gpt-5.3-codex": {},
        "vllm/kimi-k2.5:cloud": {}
      }
    }
  },
  "auth": {
    "profiles": {
      "openai-codex:default": {
        "provider": "openai-codex",
        "mode": "oauth"
      }
    }
  }
}
```

## 3) Safe-Variante ohne Fallback (hart nur 1 Modell)

### 3a) Nur lokal

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "vllm/kimi-k2.5:cloud",
        "fallbacks": []
      },
      "models": {
        "vllm/kimi-k2.5:cloud": {}
      }
    }
  }
}
```

### 3b) Nur Codex

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai-codex/gpt-5.3-codex",
        "fallbacks": []
      },
      "models": {
        "openai-codex/gpt-5.3-codex": {}
      }
    }
  }
}
```

---

**Wichtig:** Wenn du den OpenAI-Provider vermeiden willst, keine `openai/...` Modelle eintragen — nur `openai-codex/...`.

Nach Änderungen:

```bash
openclaw gateway restart
openclaw status
```
