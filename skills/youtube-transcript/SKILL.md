---
name: youtube-transcript
version: 1.0.0
description: Fetch YouTube video transcripts and optionally summarize content. Works with regular videos, Shorts, and youtu.be links.
---

# YouTube Transcript

Fetch YouTube video transcripts without external API keys. Python-based fallback when official skill isn't available.

## Setup

The script is at `~/scripts/youtube-transcript.py`

## Usage

**Fetch transcript:**
```bash
python3 ~/scripts/youtube-transcript.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

**Or with video ID only:**
```bash
python3 ~/scripts/youtube-transcript.py "VIDEO_ID"
```

**Output format:**
```json
{
  "transcript": [
    {"text": "Hello everyone", "start": 0.5, "duration": 2.1},
    {"text": "Welcome to the video", "start": 2.6, "duration": 1.8}
  ],
  "full_text": "Hello everyone Welcome to the video...",
  "language": "en",
  "video_id": "VIDEO_ID"
}
```

## Limitations

- Only works with videos that have captions (auto-generated or manual)
- May fail if YouTube changes their API
- For best results, use with `summarize` skill on the `full_text`

## Alternative

For production use, install the official skill:
```bash
npx openclaw skills add YoavRez/openclaw-youtube-transcript
```
