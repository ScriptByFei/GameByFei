#!/usr/bin/env python3
"""
YouTube Transcript Fetcher - Simple wrapper for OpenClaw
Fetches transcripts using web APIs when yt-dlp isn't available
"""
import sys
import json
import urllib.request
import urllib.parse
import re

def extract_video_id(url):
    """Extract YouTube video ID from various URL formats"""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def fetch_transcript(video_id):
    """Fetch transcript using YouTube's timedtext API"""
    try:
        # Try to get available transcript languages
        url = f"https://www.youtube.com/watch?v={video_id}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            
        # Extract caption tracks
        import re
        caption_match = re.search(r'"captionTracks":(\[.*?\])', html)
        if not caption_match:
            return {"error": "No captions available for this video"}
            
        import json
        tracks = json.loads(caption_match.group(1))
        
        if not tracks:
            return {"error": "No captions found"}
            
        # Get first available transcript (usually auto-generated)
        base_url = tracks[0].get('baseUrl', '')
        if not base_url:
            return {"error": "Could not get transcript URL"}
            
        # Fetch actual transcript
        req = urllib.request.Request(base_url + "&fmt=json3", headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        # Parse transcript events
        transcript = []
        full_text = []
        
        for event in data.get('events', []):
            if 'segs' in event:
                start_time = event.get('tStartMs', 0) / 1000
                text = ''.join(seg.get('utf8', '') for seg in event['segs'])
                if text.strip():
                    transcript.append({
                        'text': text,
                        'start': start_time,
                        'duration': event.get('dDurationMs', 0) / 1000
                    })
                    full_text.append(text)
                    
        return {
            'transcript': transcript,
            'full_text': ' '.join(full_text),
            'language': tracks[0].get('languageCode', 'unknown'),
            'video_id': video_id
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: youtube-transcript.py <video_url_or_id>"}))
        sys.exit(1)
        
    video_input = sys.argv[1]
    video_id = extract_video_id(video_input)
    
    if not video_id:
        print(json.dumps({"error": "Could not extract video ID"}))
        sys.exit(1)
        
    result = fetch_transcript(video_id)
    print(json.dumps(result, indent=2))
