# Housr Voice Backend

FastAPI backend for the Voice Concierge feature, providing TTS (text-to-speech) via ElevenLabs.

## Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Create a `.env` file with your ElevenLabs API key:
```
ELEVEN_API_KEY=your_elevenlabs_api_key_here
ELEVEN_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVEN_MODEL_ID=eleven_turbo_v2_5
CORS_ALLOW_ORIGINS=http://localhost:3000
```

3. Run the server:
```bash
python main.py
```

The server will start at `http://localhost:8001`.

## API Endpoints

- `GET /health` - Health check
- `POST /tts` - Convert text to speech
- `POST /session-log` - Log conversation sessions

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ELEVEN_API_KEY` | ElevenLabs API key (required) | - |
| `ELEVEN_VOICE_ID` | Voice ID to use | `EXAVITQu4vr4xnSDxMaL` (Rachel) |
| `ELEVEN_MODEL_ID` | Model ID | `eleven_turbo_v2_5` |
| `ELEVEN_AGENT_ID` | Agent ID for conversational AI | - |
| `CORS_ALLOW_ORIGINS` | Allowed CORS origins | `*` |

