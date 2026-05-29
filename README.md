# CBL Singing Bowl Visual Installation

CBL is a live installation built around a Tibetan singing bowl, a person on camera,
heartbeat data, cymatics, and reactive visuals.

**The installation runs in TouchDesigner (`td/cbl.toe`), standalone.** For the
19 June 2026 demo it runs as **one surface (TouchDesigner) on one webcam**: TD does
the camera feed, MediaPipe body/hand tracking, a GPU hand-particle system, a
hand-warped body aura, cymatics, aurora, and bowl-audio chakra detection — all on the
GPU, from a single laptop, **with no browser open**. See
[`docs/touchdesigner-onesurface-2026-05-27.md`](docs/touchdesigner-onesurface-2026-05-27.md).

The React/Vite **web app in this repo is a secondary dev tool / fallback.** It mirrors
the same visual language on an HTML canvas and was the original prototype; it is not
launched at the demo and the installation does not depend on it. Most of the
"Getting Started", "Scripts", and "Troubleshooting" sections below describe that web app.

Current direction:

```text
The bowl sound controls the color and pattern.
The heartbeat controls the pulse.
The camera places the aura and particles around the person.
TouchDesigner renders the artwork on the projector.
```

Poetry is no longer part of the experience. The old poem client/server code is still in the repo as dormant legacy code in case the team wants it later.

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

- **Installation (primary)**: TouchDesigner (GPU node network `/project1/cbl`), GLSL, and MediaPipe running in TD's own Python (`td/mp_engine.py`)
- **Web app (secondary / fallback)**:
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
├── td/                           # ★ PRIMARY: the TouchDesigner installation
│   ├── cbl.toe                   #   the GPU network /project1/cbl (the demo)
│   ├── mp_engine.py              #   MediaPipe pose tracking inside TD (no browser)
│   ├── pose_mp_callbacks.py      #   pose_mp scriptCHOP (feeds TD's own camera in)
│   ├── models/                   #   bundled MediaPipe .task models (offline)
│   ├── aura_warp.frag            #   hand-warped body-aura shader
│   ├── enable_bowl_audio.py      #   add the live bowl mic on the demo laptop
│   └── requirements.txt          #   recreate pylibs/ (git-ignored runtime)
├── docs/                         # Architecture, status, and AI handoff notes
├── public/audio/                 # Legacy sample audio assets
├── scripts/                      # Legacy sample-generation helper
├── server/                       # Dormant legacy poem API
├── src/                          # Web app (secondary / fallback)
│   ├── audio/                    #   Mic, heartbeat, and audio/chakra analysis
│   ├── camera/                   #   Webcam and MediaPipe pose tracking hooks
│   ├── components/               #   Canvas camera stage
│   ├── net/                      #   usePoseStream — retired web→TD pose bridge
│   ├── poetry/                   #   Dormant legacy browser API client
│   ├── App.tsx                   #   Main app shell
│   └── types.ts                  #   Shared request/response and tracking types
├── tests/e2e/                    # Playwright browser test
├── CLAUDE.md                     # AI handoff architecture note
├── package.json                  # Scripts and dependencies
└── vite.config.ts                # Vite dev server and test config
```

## Current Design Direction

The project removed poetry and now builds the installation **in TouchDesigner**, running
standalone on one webcam. The web app is kept as a fallback.

Plain group explanation:

```text
The MATLAB part analyzes the bowl sound.
TouchDesigner turns that sound — plus the live camera and body tracking —
into the visuals projected around the person.
```

The final demo should feel like a polished audiovisual artwork driven live by the bowl,
the heartbeat, and the person's movement.

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

The TikTok recommends learning TouchDesigner through white abstract visuals, audio-reactive bloom particles, and hand tracking. The web-app version translated those ideas onto an HTML canvas; **the installation now builds them in TouchDesigner itself** (the learning path realized in the real tool). See [`docs/touchdesigner-onesurface-2026-05-27.md`](docs/touchdesigner-onesurface-2026-05-27.md).

## Run The Installation (TouchDesigner — this is the demo)

Standalone, no browser. On a machine with TouchDesigner (2025+) installed and the webcam connected:

```powershell
& "C:\Program Files\Derivative\TouchDesigner\bin\TouchDesigner.exe" "C:\projects\CBL\td\cbl.toe"
```

- Stand in front of the webcam — TD does its own MediaPipe pose tracking; particles
  gather to still hands / scatter from fast ones, and the aura warps toward your hands.
- `master_out` (1280×720) is the projector feed.
- On the demo laptop, enable the live bowl mic by pasting `td/enable_bowl_audio.py` into
  the Textport. Keep `cbl.toe` saved **without** a live audio op (it can hang TD — see
  `memory/touchdesigner_setup.md`).
- MediaPipe models are bundled in `td/models/` (offline-safe). The Python runtime
  `td/pylibs/` is git-ignored; recreate it with
  `pip install -r td/requirements.txt --target td/pylibs`.

Full architecture + boot-hang reboot rule:
[`docs/touchdesigner-onesurface-2026-05-27.md`](docs/touchdesigner-onesurface-2026-05-27.md)
and `td/README.md`.

> **Track B (still open):** the committed `cbl.toe` still uses the retired browser pose
> bridge as its source. Swapping it to the TD-native `pose_mp` scriptCHOP is the last
> wiring step — see the one-surface doc.

## The Web App (secondary / fallback)

The rest of this README covers the React/Vite web app: the original prototype, now a dev
tool / fallback that mirrors the visuals on a canvas.

### Prerequisites

- Node.js 24 or newer
- npm 11 or newer
- A webcam for the full interactive experience
- A microphone for bowl input

No API key is required.

### Getting Started

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Start The App

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
