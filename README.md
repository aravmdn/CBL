# CBL Singing Bowl Visual Installation

CBL is a local browser prototype for a live installation built around a Tibetan singing bowl, a person on camera, simulated heartbeat data, cymatics, and TouchDesigner-inspired visuals.

Current direction:

```text
The bowl sound controls the color and pattern.
The heartbeat controls the pulse.
The camera places the aura around the person.
The visual stage is the main artwork.
```

Poetry is no longer part of the active app experience. The old poem client/server code is still in the repo as dormant legacy code in case the team wants it later, but the live UI does not show poems, poem buttons, or poem overlays.

## Key Features

- Webcam-based visual stage with mirrored camera feed or fallback scene.
- MediaPipe pose tracking for head, shoulder, wrist, and torso anchors.
- Bowl microphone input through the browser.
- Live FFT analysis that finds the strongest bowl frequencies.
- Chakra detection using the teammate frequency/color table.
- Artistic cymatics layer based on the teammate MATLAB formula `k = frequency / 80`.
- TouchDesigner-inspired white visual field, bloom particles, and tracking-node overlays.
- Simulated heartbeat with BPM drift, HRV-style variability, and beat pulses.
- Responsive control rail focused on mic, pulse, chakra, and frequency status.
- Unit, component, legacy API, and Playwright E2E tests.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Rendering**: HTML canvas 2D API
- **Audio**: Web Audio API
- **Camera / Pose Tracking**: `navigator.mediaDevices.getUserMedia` and `@mediapipe/tasks-vision`
- **Backend**: Express 5, TypeScript, `tsx` for dormant legacy poem API
- **Testing**: Vitest, React Testing Library, Supertest, Playwright
- **Package Manager**: npm

## Project Structure

```text
.
├── docs/                         # Current status, ideation, and AI handoff notes
├── public/
│   └── audio/                    # Legacy sample audio assets
├── scripts/                      # Legacy sample-generation helper
├── server/                       # Dormant legacy poem API
├── src/
│   ├── audio/                    # Mic, heartbeat, and audio/chakra analysis
│   ├── camera/                   # Webcam and MediaPipe pose tracking hooks
│   ├── components/               # Canvas camera stage
│   ├── poetry/                   # Dormant legacy browser API client
│   ├── App.tsx                   # Main app shell
│   └── types.ts                  # Shared request/response and tracking types
├── tests/
│   └── e2e/                      # Playwright browser test
├── CLAUDE.md                     # AI handoff architecture note
├── package.json                  # Scripts and dependencies
└── vite.config.ts                # Vite dev server and test config
```

## Current Design Direction

The latest project pivot removes poetry from the live demo and puts the focus on the visual installation.

Plain group explanation:

```text
The MATLAB part analyzes the bowl sound.
The web app turns that sound into live visuals around the person.
```

The final demo should feel like a polished audiovisual artwork, not a text-generation app.

## Teammate MATLAB Integration

The teammate MATLAB work lives outside the tracked app code in `EngineeringArt CBL/`.

It provides:

- microphone FFT analysis
- strongest frequency selection
- cymatics pattern generation
- chakra frequency/color mapping

The web app translates that idea into browser code:

```text
bowl sound
-> browser microphone
-> strongest frequencies
-> nearest chakra color
-> cymatics pattern and aura tint
-> TouchDesigner-style visual response
```

The current visuals are intentionally artistic, not a direct MATLAB graph. The scientific role of the MATLAB work is still present because the real bowl sound drives the pattern and color.

## TouchDesigner Visual Reference

The current stage follows ideas from this TikTok reference:

- https://vm.tiktok.com/ZGdHggUDC/
- resolved: https://www.tiktok.com/@studio.kashi/video/7617655149653167390

The TikTok recommends learning TouchDesigner through white abstract visuals, audio-reactive bloom particles, and hand tracking. This project keeps the React/Vite web-app architecture and translates those ideas into the canvas stage.

## Prerequisites

- Node.js 24 or newer
- npm 11 or newer
- A webcam for the full interactive experience
- A microphone for bowl input

No API key is required for the active visual demo.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start The App

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

The command starts both processes:

- Vite app: `http://127.0.0.1:5173/`
- Express legacy API: `http://127.0.0.1:8787/`

The active app UI is on port `5173`. The legacy API is kept only because the old poem code still has tests.

If port `5173` is already in use, close the old dev server or run only the client on a different port:

```bash
npm run dev:client -- --port 5174
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite app and legacy API together. |
| `npm run dev:client` | Start only the Vite frontend on strict port `5173`. |
| `npm run server` | Start only the dormant legacy Express API in watch mode. |
| `npm run server:start` | Start only the dormant legacy Express API without watch mode. |
| `npm run sample:audio` | Regenerate the legacy sample audio asset. |
| `npm run build` | Typecheck and build the Vite app. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run Vitest unit, component, and legacy API tests. |
| `npm run test:e2e` | Run the Playwright browser test. |
| `npm run test:all` | Run Vitest and Playwright tests. |

## How It Works

```text
Camera
  -> local pose tracking
  -> body anchors for aura, bloom, and tracking nodes

Bowl microphone
  -> browser FFT analysis
  -> strongest frequency peaks
  -> nearest chakra color
  -> cymatics pattern and aura tint

Simulated heartbeat
  -> BPM, trend, variability, beat pulse
  -> aura pulse and visual intensity
```

## Privacy Boundary

The browser asks for camera and microphone access.

- Camera frames stay in the browser.
- Microphone audio stays in the browser.
- The active app does not send camera frames, microphone audio, heartbeat data, or chakra data to the server.

## Dormant Poetry Code

Poetry is parked for now, not deleted.

Legacy files still exist:

- `src/poetry/poemClient.ts`
- `server/app.ts`
- `server/openaiPoem.ts`
- `server/validation.ts`
- `server/*.test.ts`

Do not treat these as active product behavior. They are there only in case the group decides to bring text generation back later.

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
- visual app shell without active poetry controls
- camera granted/denied app states
- canvas aura/cymatics/bloom rendering behavior
- dormant legacy poem API validation
- Playwright flow for starting the bowl session and checking a nonblank canvas

Playwright uses fake camera/microphone permissions, so real bowl detection still needs manual testing with the physical setup.

## Troubleshooting

### The Browser Opens `http://127.0.0.1:8787/`

That is the legacy API server. Use the frontend URL:

```text
http://127.0.0.1:5173/
```

### Port `5173` Is Already In Use

Another Vite server is already running. Close that terminal, or run:

```bash
npm run dev:client -- --port 5174
```

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

- HTTPS for camera and microphone access outside localhost
- a static frontend build from `npm run build`
- optional hosting for the dormant legacy API only if poetry is re-enabled
- CORS and rate limits if any public API is exposed later

## Security Notes

- Never commit `.env` or real API keys.
- Rotate any key that was pasted into chat or logs.
- Camera frames and raw microphone audio are intentionally kept client-side.
- The active visual app does not need a text-generation provider key.

## License

No license has been selected yet. Add one before publishing this as open source.
