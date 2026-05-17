# CBL — Creative Bowl Lab

TU/e Multi-Disciplinary CBL course project, Group 5, Year 2 Q4 2025-2026.
**Final presentation:** 19 June 2026.

## Concept

Tibetan singing bowl → physically alters person's heartbeat → Arduino pulse sensor captures BPM/HRV → web app drives:
- Aurora aura on camera (intensity pulses with each beat)
- Cymatics (Chladni) interference pattern (shape/color from bowl mic + chakra frequencies)
- Claude-generated poem (mood from BPM trend and heart rate variability)

## Running the project

```
npm install
npm run dev        # Vite dev server on :5173, CF Worker proxy on :8787
npm test           # Vitest (16 tests, all must pass before commit)
npm run build      # TypeScript check + Vite production build
```

Requires `OPENROUTER_API_KEY` or `OPENAI_API_KEY` in a `.env` file for poetry generation.
The Cloudflare Worker in `functions/api/poem.ts` reads those vars at runtime.

## Architecture

```
useMicInput        — getUserMedia (bowl mic), AnalyserNode, 40-bar FFT visualizer
useHeartbeat       — simulated 70→62 BPM calming arc (hardware swap point marked)
useCamera          — webcam via getUserMedia
usePoseTracking    — MediaPipe PoseLandmarker, head/shoulder/torso anchors
CameraStage        — canvas: aurora curtains + body aura + cymatics overlay + poem text
requestPoem        — POST /api/poem with { session, heartbeat: { bpm, trend, variability } }
```

## Key files

| File | Purpose |
|---|---|
| `src/audio/useHeartbeat.ts` | Simulated heartbeat — **swap body for Web Serial API reads when Arduino arrives** |
| `src/audio/useMicInput.ts` | Live mic capture for bowl audio |
| `src/audio/audioAnalysis.ts` | Goertzel chakra detection (396–963 Hz), band energy, BPM estimation |
| `src/components/CameraStage.tsx` | All canvas rendering: aura, cymatics (sin(kx)·sin(ky)), poem overlay |
| `src/poetry/poemClient.ts` | POST /api/poem — accepts HeartbeatFeatures |
| `functions/api/poem.ts` | CF Worker — calls OpenRouter/OpenAI, needs prompt update for bowl context |

## What is done

- [x] Live bowl mic capture (`useMicInput`) with FFT visualizer bars
- [x] Simulated heartbeat with calming BPM drift and HRV jitter (`useHeartbeat`)
- [x] Goertzel chakra frequency detection on mic audio (7 solfeggio freqs from teammate's CSV)
- [x] Cymatics (Chladni) layer on canvas — ported from teammate's MATLAB `sin(kx)·sin(ky)`
- [x] Heartbeat aura pulse — exponential decay `exp(-beatAge/300ms)` per beat
- [x] MediaPipe body anchor tracking for aura positioning
- [x] Poetry generation from heartbeat features (BPM, trend, variability)
- [x] Copy poem, error states, seed poem for offline use
- [x] Responsive layout (desktop + mobile)
- [x] 16 passing tests

## Pending — hardware not yet available

| Task | Where to change | Notes |
|---|---|---|
| Arduino pulse sensor → real BPM | `src/audio/useHeartbeat.ts` — replace `setTimeout` loop with `navigator.serial` reads | Interface (`HeartbeatState`) is already defined; swap only the `useEffect` body |
| Bowl chakra → live dominant chakra to poem API | `src/App.tsx` line ~55 — change `dominantChakra: null` to `mic.dominantChakra` | Need to expose `dominantChakra` from `useMicInput` (audioAnalysis already computes it) |
| CF Worker prompt | `functions/api/poem.ts` | Update prompt template to use `heartbeat.bpm`, `heartbeat.trend`, `heartbeat.variability`, `heartbeat.dominantChakra` fields instead of old sample analysis fields |

## Teammate contributions (EngineeringArt CBL/)

- `frequency_colours.csv` → `CHAKRAS` constant in `audioAnalysis.ts`
- `goertzel_analysis.m` → `goertzelMagnitude()` in `audioAnalysis.ts`
- `chladni_simulation.m` → `drawCymaticsPattern()` in `CameraStage.tsx`
- `camera_input.m` → maps to existing `useCamera.ts` (already covered)

## Constraints

- Physical installation demo on 19 June 2026 — code must work on a laptop pointed at a person
- All 6 disciplines must have a visible role — Arav owns the signal processing pipeline
- Budget €100 — no paid cloud services beyond the LLM API key
- Must work without internet for the demo (seed poem fallback already in place)
