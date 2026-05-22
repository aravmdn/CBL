# CBL Singing Bowl Installation

CBL is a local browser prototype for a live installation built around a Tibetan singing bowl, a person on camera, simulated heartbeat data, cymatics, and AI-generated poetry.

The main idea is simple:

```text
The bowl sound controls the color and pattern.
The heartbeat controls the pulse.
The camera places the aura around the person.
The poem responds to the body and sound state.
```

Camera frames stay in the browser. The server receives only summarized heartbeat/chakra information when generating a poem.

## Key Features

- Webcam-based visual stage with mirrored camera feed or fallback scene.
- MediaPipe pose tracking for head, shoulder, and torso anchors.
- Bowl microphone input through the browser.
- Live FFT analysis that finds the strongest bowl frequencies.
- Chakra detection using the teammate frequency/color table.
- Artistic cymatics layer based on the teammate MATLAB formula `k = frequency / 80`.
- Simulated heartbeat with BPM drift, HRV-style variability, and beat pulses.
- AI poem generation through OpenRouter or OpenAI-compatible configuration.
- Seed poem fallback for offline/demo use.
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
├── docs/                         # Current status, ideation, and AI handoff notes
├── public/
│   └── audio/                    # Legacy sample audio assets
├── scripts/                      # Legacy sample-generation helper
├── server/
│   ├── app.ts                    # Express app and API routes
│   ├── index.ts                  # API server entrypoint
│   ├── openaiPoem.ts             # OpenRouter/OpenAI poetry integration
│   └── validation.ts             # Request and model-output validation
├── src/
│   ├── audio/                    # Mic, heartbeat, and audio/chakra analysis
│   ├── camera/                   # Webcam and MediaPipe pose tracking hooks
│   ├── components/               # Canvas camera stage
│   ├── poetry/                   # Browser API client
│   ├── App.tsx                   # Main app shell
│   └── types.ts                  # Shared request/response and tracking types
├── tests/
│   └── e2e/                      # Playwright browser test
├── CLAUDE.md                     # Existing architecture note
├── package.json                  # Scripts and dependencies
└── vite.config.ts                # Vite dev server and test config
```

## Teammate MATLAB Integration

The teammate MATLAB work lives outside the tracked app code in `EngineeringArt CBL/`.

It provides:

- microphone FFT analysis
- strongest frequency selection
- cymatics pattern generation
- chakra frequency/color mapping

The web app now translates that idea into browser code:

```text
bowl sound
-> browser microphone
-> strongest frequencies
-> nearest chakra color
-> cymatics pattern and aura tint
-> poem context
```

The current visuals are intentionally artistic, not a direct MATLAB graph. The scientific role of the MATLAB work is still present because the real bowl sound drives the pattern and color.

## Prerequisites

- Node.js 24 or newer
- npm 11 or newer
- A webcam for the full interactive experience
- A microphone for bowl input
- Optional: OpenRouter or OpenAI API key for live poem generation

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

Set at least one provider key for live poem generation:

```env
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=8787
```

The app still works visually without an API key, but live poem generation will show a clear missing-key error. The seed poem remains available.

### 3. Start The App

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

The API URL is not the app UI. If the browser shows only API output or a blank route, use port `5173`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API server and Vite app together. |
| `npm run dev:client` | Start only the Vite frontend on strict port `5173`. |
| `npm run server` | Start only the Express API in watch mode. |
| `npm run server:start` | Start only the Express API without watch mode. |
| `npm run sample:audio` | Regenerate the legacy sample audio asset. |
| `npm run build` | Typecheck and build the Vite app. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run Vitest unit, component, and API tests. |
| `npm run test:e2e` | Run the Playwright browser test. |
| `npm run test:all` | Run Vitest and Playwright tests. |

## How It Works

### Runtime Flow

```text
Camera
  -> local pose tracking
  -> body anchors for aura and poem placement

Bowl microphone
  -> browser FFT analysis
  -> strongest frequency peaks
  -> nearest chakra color
  -> cymatics pattern and aura tint

Simulated heartbeat
  -> BPM, trend, variability, beat pulse
  -> aura pulse and poem context

Poem button
  -> POST /api/poem
  -> OpenRouter/OpenAI text generation
  -> poem lines returned to browser
```

### Privacy Boundary

The browser asks for camera and microphone access.

- Camera frames stay in the browser.
- Microphone audio stays in the browser.
- The server receives only summarized heartbeat/chakra data for poem generation.

### API Contract

`POST /api/poem`

Request:

```json
{
  "session": "bowl-meditation",
  "heartbeat": {
    "bpm": 68,
    "trend": "calming",
    "variability": 0.4,
    "dominantChakra": {
      "name": "Heart",
      "frequency": 639,
      "color": "#00ff00"
    }
  }
}
```

`dominantChakra` can be `null` when no strong bowl frequency is detected yet.

Response:

```json
{
  "lines": [
    "the bowl rings",
    "your pulse slows to meet it",
    "sound becomes body",
    "body becomes still",
    "in the resonance"
  ],
  "moodWords": ["resonant", "still", "present"],
  "palette": {
    "primary": "#8ee8ff",
    "accent": "#f4c979"
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

Current coverage includes:

- deterministic audio feature extraction
- poem request validation and malformed provider output handling
- missing provider-key API behavior
- app states for camera granted/denied and poem generation
- canvas aura/cymatics rendering behavior
- Playwright flow for starting the bowl session, generating a poem, and checking a nonblank canvas

Playwright uses fake camera/microphone permissions, so real bowl detection still needs manual testing with the physical setup.

## Troubleshooting

### The Browser Opens `http://127.0.0.1:8787/`

That is the API server. Use the frontend URL:

```text
http://127.0.0.1:5173/
```

### Poetry Generation Says A Key Is Missing

Check that `.env` exists and includes one of:

```env
OPENROUTER_API_KEY=...
OPENAI_API_KEY=...
```

Restart `npm run dev` after changing `.env`.

### Camera Or Microphone Permission Is Denied

Allow camera and microphone access in the browser, then reload the app. If the camera is unavailable, the canvas falls back to a non-camera visual surface.

### The Chakra Color Jumps Around

The current thresholds are a first pass. Tune these constants in `src/audio/useMicInput.ts` after testing with the real bowl and room:

- `MIN_PEAK_FREQUENCY`
- `MAX_PEAK_FREQUENCY`
- `PEAK_SPACING_HZ`
- `MIN_DOMINANT_MAGNITUDE`

### Effects Do Not Appear

Press the microphone button to start the bowl session. The strongest visual effects appear when a person is detected and the session is active.

## Deployment Notes

This is currently designed as a local prototype. A production deployment would need:

- a hosted API service for `server/index.ts`
- HTTPS for camera and microphone access outside localhost
- provider keys stored in hosting secrets
- a static frontend build from `npm run build`
- CORS and rate limits appropriate for public traffic

For a quick hosted split, deploy the Vite app as static assets and run the Express API on a Node-capable host. Keep all provider keys on the server side.

## Security Notes

- Never commit `.env` or real API keys.
- Rotate any key that was pasted into chat or logs.
- Camera frames and raw microphone audio are intentionally kept client-side.
- API responses are validated before reaching the UI.

## License

No license has been selected yet. Add one before publishing this as open source.
