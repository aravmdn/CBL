# CBL Camera Poetry Prototype

CBL is a local browser prototype that turns a bundled audio sample, webcam pose detection, and AI-generated poetry into a live visual performance. The camera feed stays local in the browser; only summarized audio features are sent to the local server when generating poetry.

## Key Features

- Webcam-based creative stage with a mirrored camera feed.
- Person-gated visual effects: particles, trails, poem snippets, and waveform overlays only activate when a person is detected and the music is playing.
- Bundled synthesized audio sample, `Luminous Drift`, with browser-side Web Audio analysis.
- Server-side poetry generation through OpenRouter or OpenAI-compatible configuration.
- MediaPipe pose detection for head, shoulder, and torso anchors.
- Unit, component, API, and Playwright E2E tests.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Rendering**: HTML canvas 2D API
- **Audio**: Web Audio API
- **Camera / Pose Tracking**: `navigator.mediaDevices.getUserMedia` and `@mediapipe/tasks-vision`
- **Backend**: Express 5, TypeScript, `tsx`
- **AI Provider**: OpenRouter by default, with OpenAI SDK compatibility
- **Testing**: Vitest, React Testing Library, Supertest, Playwright
- **Package Manager**: npm

## Project Structure

```text
.
├── public/
│   └── audio/
│       └── luminous-drift.wav      # Generated royalty-free sample audio
├── scripts/
│   └── generate-audio-sample.mjs   # Recreates the bundled WAV sample
├── server/
│   ├── app.ts                      # Express app and API routes
│   ├── index.ts                    # API server entrypoint
│   ├── openaiPoem.ts               # OpenRouter/OpenAI poetry integration
│   └── validation.ts               # Request and model-output validation
├── src/
│   ├── audio/                      # Web Audio analysis and playback hook
│   ├── camera/                     # Webcam and MediaPipe pose tracking hooks
│   ├── components/                 # Canvas camera stage
│   ├── poetry/                     # Browser API client
│   ├── App.tsx                     # Main app shell
│   └── types.ts                    # Shared request/response and tracking types
├── tests/
│   └── e2e/                        # Playwright browser test
├── .env.example                    # Environment variable template
├── package.json                    # Scripts and dependencies
└── vite.config.ts                  # Vite dev server and test config
```

## Prerequisites

- Node.js 24 or newer
- npm 11 or newer
- A webcam for the full interactive experience
- An OpenRouter API key, or an OpenAI API key if you change the provider configuration

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a local `.env` file from the example:

```bash
copy .env.example .env
```

On macOS/Linux, use:

```bash
cp .env.example .env
```

Set at least one provider key:

```env
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=8787
```

`.env` is ignored by git. Do not commit real API keys.

### 3. Start the App

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

The command starts both processes:

- Vite app: `http://127.0.0.1:5173/`
- Express API: `http://127.0.0.1:8787/`

The API URL is not the app UI. If the browser shows only API output or a blank route, make sure you are using port `5173`.

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | Recommended | - | OpenRouter key used by the local API server. |
| `OPENROUTER_MODEL` | Optional | `openai/gpt-4o-mini` | OpenRouter model slug for poetry generation. |
| `OPENAI_API_KEY` | Optional fallback | - | OpenAI key used only when no OpenRouter key is present. |
| `OPENAI_MODEL` | Optional | `gpt-5-mini` | OpenAI Responses API model for the fallback provider. |
| `PORT` | Optional | `8787` | Local Express API port. |

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API server and Vite app together. |
| `npm run dev:client` | Start only the Vite frontend on strict port `5173`. |
| `npm run server` | Start only the Express API in watch mode. |
| `npm run server:start` | Start only the Express API without watch mode. |
| `npm run sample:audio` | Regenerate `public/audio/luminous-drift.wav`. |
| `npm run build` | Typecheck and build the Vite app. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run Vitest unit, component, and API tests. |
| `npm run test:e2e` | Run the Playwright browser test. |
| `npm run test:all` | Run Vitest and Playwright tests. |

## How It Works

### Runtime Flow

```text
Bundled audio sample
        ↓
Browser Web Audio analysis
        ↓
Summarized audio features
        ↓
POST /api/poem
        ↓
OpenRouter/OpenAI text generation
        ↓
Poem lines returned to browser
        ↓
Canvas effects bind to detected body anchors
```

### Privacy Boundary

The browser asks for webcam access and uses frames locally for MediaPipe pose detection. Camera frames are not sent to the server or to the AI provider. The poetry request contains only:

- sample name
- duration
- average and peak energy
- bass, mids, and treble balance
- estimated pulse BPM

### Person-Gated Effects

The visual stage always renders the camera feed or fallback camera surface. Effects are intentionally dormant until both conditions are true:

1. MediaPipe detects a useful body pose.
2. The `Luminous Drift` sample is playing.

When active, particles and trails orbit detected head, shoulder, and torso anchors. Poem snippets are placed near body-relative positions instead of arbitrary screen coordinates.

### API Contract

`POST /api/poem`

Request:

```json
{
  "sampleName": "Luminous Drift",
  "durationSec": 48,
  "features": {
    "averageEnergy": 0.4,
    "peakEnergy": 0.8,
    "bass": 0.3,
    "mids": 0.5,
    "treble": 0.2,
    "pulseBpm": 84
  }
}
```

Response:

```json
{
  "lines": [
    "whispers of light dance in the air",
    "echoes of joy in fleeting moments",
    "colors pulse alive, a heartbeat",
    "soft sounds weave through silence",
    "each gaze ignites the night"
  ],
  "moodWords": ["intimate", "luminous", "suspended"],
  "palette": {
    "primary": "#FF6B6B",
    "accent": "#FFD93D"
  }
}
```

## Testing

Run the normal verification set:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Test coverage includes:

- deterministic audio feature extraction
- poem request validation and malformed provider output handling
- missing provider-key API behavior
- app states for camera granted/denied and poem generation
- person-gated canvas effects
- Playwright flow for playback, poem generation, and nonblank canvas rendering

Playwright uses a fake camera stream, so the rendered stage may show Chromium's green test video. A real laptop camera is used during normal manual testing in the browser.

## Troubleshooting

### The Browser Opens `http://127.0.0.1:8787/`

That is the API server. Use the frontend URL:

```text
http://127.0.0.1:5173/
```

### Poetry Generation Says a Key Is Missing

Check that `.env` exists and includes one of:

```env
OPENROUTER_API_KEY=...
OPENAI_API_KEY=...
```

Restart `npm run dev` after changing `.env`.

### OpenRouter Returns a Credit or Token Error

The app caps poem responses to a small completion budget. If OpenRouter still rejects the request, add credits to the OpenRouter account or use a cheaper model slug in `OPENROUTER_MODEL`.

### Camera Permission Is Denied

Allow camera access in the browser and reload the app. If the camera is unavailable, the canvas falls back to a non-camera visual surface.

### Effects Do Not Appear

Effects only activate when a person is detected and the sample is playing. Make sure your face and shoulders are visible in the camera frame, then press play.

## Deployment Notes

This is currently designed as a local prototype. A production deployment would need:

- a hosted API service for `server/index.ts`
- HTTPS for camera access outside localhost
- provider keys stored in hosting secrets
- a static frontend build from `npm run build`
- CORS and rate limits appropriate for public traffic

For a quick hosted split, deploy the Vite app as static assets and run the Express API on a Node-capable host. Keep all provider keys on the server side.

## Security Notes

- Never commit `.env` or real API keys.
- Rotate any key that was pasted into chat or logs.
- Camera frames are intentionally kept client-side.
- API responses are validated before reaching the UI.

## License

No license has been selected yet. Add one before publishing this as open source.
