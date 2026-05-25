# CBL - Creative Bowl Lab

TU/e Multi-Disciplinary CBL course project, Group 5, Year 2 Q4 2025-2026.
**Final presentation:** 19 June 2026.

## Current Concept

Tibetan singing bowl -> physically alters person's heartbeat -> Arduino pulse sensor captures BPM/HRV -> web app drives:

- Aurora aura on camera, pulsing with each beat
- Cymatics interference pattern, shaped by bowl mic frequencies
- Chakra color response from the teammate frequency table
- TouchDesigner-inspired white visuals, audio bloom particles, and hand/body tracking nodes

Latest direction update, 2026-05-25: poetry is no longer part of the active demo. Keep old poetry files as dormant legacy code only. The live experience should be an impressive design/TouchDesigner-style visual installation.

## Running The Project

```powershell
npm install
npm run dev        # Vite app on :5173, legacy Express API on :8787
npm test           # Vitest tests
npm run build      # TypeScript check + Vite production build
```

No API key is required for the active visual app.

## Architecture

```text
useMicInput        - getUserMedia (bowl mic), AnalyserNode, top frequency peaks, chakra detection
useHeartbeat       - simulated 70->62 BPM calming arc (hardware swap point marked)
useCamera          - webcam via getUserMedia
usePoseTracking    - MediaPipe PoseLandmarker, head/shoulder/wrist/torso anchors
CameraStage        - canvas: aurora curtains + body aura + cymatics + bloom particles + tracking nodes
legacy poem API    - dormant server/client code, not connected to the active UI
```

## Reference Docs

- `docs/index.md` - start here for current handoff.
- `docs/current-status.md` - current app state and known risks.
- `docs/matlab-integration-ideation.md` - teammate MATLAB integration rationale.
- `docs/touchdesigner-reference.md` - TikTok reference link, goal, and TouchDesigner-inspired visual pass.
- `docs/ai-handoff.md` - concise takeover notes for Claude/Codex.

## Key Files

| File | Purpose |
|---|---|
| `src/audio/useHeartbeat.ts` | Simulated heartbeat; swap body for Web Serial API reads when Arduino arrives |
| `src/audio/useMicInput.ts` | Live mic capture for bowl audio, FFT peaks, nearest chakra |
| `src/audio/audioAnalysis.ts` | Goertzel chakra detection (396-963 Hz), band energy, BPM estimation |
| `src/camera/usePoseTracking.ts` | MediaPipe pose tracking, including wrist anchors for hand-tracking visuals |
| `src/components/CameraStage.tsx` | Canvas rendering: camera, aura, cymatics, bloom particles, tracking nodes |
| `src/App.tsx` | Main visual app shell, mic toggle, heartbeat state, signal readouts |
| `src/poetry/poemClient.ts` | Dormant legacy poem client; not imported by the app |
| `server/openaiPoem.ts` | Dormant legacy OpenRouter/OpenAI integration |
| `server/validation.ts` | Dormant legacy poem request validation |

## What Is Done

- [x] Live bowl mic capture (`useMicInput`) with FFT visualizer bars
- [x] Top-frequency peak detection from the live bowl mic
- [x] Simulated heartbeat with calming BPM drift and HRV jitter (`useHeartbeat`)
- [x] Chakra color detection from nearest live mic frequency
- [x] Cymatics layer on canvas, ported from teammate's MATLAB `sin(kx) * sin(ky)`
- [x] Heartbeat aura pulse with exponential decay per beat
- [x] MediaPipe body anchor tracking for aura positioning
- [x] Wrist anchors for TouchDesigner-style hand/body tracking visuals
- [x] TouchDesigner-inspired white visual field and audio-reactive bloom particles
- [x] Active poem UI removed
- [x] Responsive layout focused on the visual stage

## Pending - Hardware Not Yet Available

| Task | Where to change | Notes |
|---|---|---|
| Arduino pulse sensor -> real BPM | `src/audio/useHeartbeat.ts`; replace `setTimeout` loop with `navigator.serial` reads | Interface (`HeartbeatState`) is already defined; swap only the `useEffect` body |
| Tune bowl chakra detection | `src/audio/useMicInput.ts` | Test with the real bowl/mic and tune frequency/magnitude thresholds if detection jumps |
| Tune visual intensity | `src/components/CameraStage.tsx` | Test on the demo laptop/projector and adjust white field, bloom particles, aura, and tracking node opacity |

## Teammate Contributions (`EngineeringArt CBL/`)

- `frequency_colours.csv` -> `CHAKRAS` constant in `audioAnalysis.ts`
- `goertzel_analysis.m` -> `goertzelMagnitude()` in `audioAnalysis.ts`
- `chladni_simulation.m` -> `drawCymaticsPattern()` in `CameraStage.tsx`
- `camera_input.m` -> maps to existing `useCamera.ts`

## Visual Reference

The user shared this TikTok and asked to follow the tutorial/reference:

- https://vm.tiktok.com/ZGdHggUDC/
- resolved: https://www.tiktok.com/@studio.kashi/video/7617655149653167390

Implementation decision: keep this as a React/Vite web app and translate the TouchDesigner learning path into canvas visuals: white abstract visuals, audio-reactive bloom particles, and wrist/body tracking nodes.

## Constraints

- Physical installation demo on 19 June 2026; code must work on a laptop pointed at a person.
- All 6 disciplines should have a visible role; Arav owns the signal-processing pipeline.
- Budget EUR 100; avoid paid services for the active demo.
- Must work without internet for the demo. This is easier now because poetry is dormant.
