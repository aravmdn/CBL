# CBL - Creative Bowl Lab

TU/e Multi-Disciplinary CBL course project, Group 5, Year 2 Q4 2025-2026.
**Final presentation:** 19 June 2026.

## Current Concept

Tibetan singing bowl -> physically alters person's heartbeat -> Arduino pulse sensor captures BPM/HRV -> web app drives:

- Aurora aura on camera, pulsing with each beat; color encodes BPM (violet=calm, cyan=resting, amber=neutral, orange=elevated)
- Cymatics interference pattern, shaped by bowl mic frequencies, colored by detected chakra
- Chakra color response from the teammate frequency table (396–963 Hz Solfeggio scale)
- TouchDesigner-inspired white visuals, audio bloom particles, and hand/body tracking nodes

**Direction as of 2026-05-25 (Meeting 5.2):** Poetry is permanently off the table. Focus is on the visual installation and the group report. Keep old poetry files as dormant legacy code only.

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
useMicInput        - getUserMedia (bowl mic), AnalyserNode, top-8 FFT frequency peaks, chakra detection
useHeartbeat       - simulated 70->62 BPM calming arc with HRV jitter (hardware swap point marked)
useCamera          - webcam via getUserMedia
usePoseTracking    - MediaPipe PoseLandmarker, head/shoulder/wrist/torso anchors; mirrored for selfie view
CameraStage        - canvas pipeline:
                     1. deep void background (#06060C)
                     2. mirrored camera feed (or fallback silhouette)
                     3. color wash + ambient fog gradient
                     4. white visual field (TouchDesigner-style ripple grid)
                     5. cymatics pattern (chakra-colored sin(kx)*sin(ky), 64px offscreen canvas)
                     6. aurora curtains (4 screen-blend ribbons, BPM-tinted on beat)
                     7. body aura (OneEuroFilter-smoothed anchors, BPM→color halo + per-anchor glows)
                     8. audio bloom particles (96 particles, chakra-colored)
                     9. tracking nodes + skeleton lines (head/shoulders/wrists)
                    10. frequency bar visualizer (bottom edge)
App.tsx            - main shell; auto-hide controls after 3s inactivity; mic toggle; heartbeat + chakra readouts
legacy poem API    - dormant server/client code, not connected to the active UI
```

## Reference Docs

- `docs/index.md` — start here for current handoff.
- `docs/current-status.md` — current app state and known risks.
- `docs/matlab-integration-ideation.md` — teammate MATLAB integration rationale.
- `docs/touchdesigner-reference.md` — TikTok reference link, goal, and TouchDesigner-inspired visual pass.
- `docs/touchdesigner-for-teammates.md` — plain-language TD explainer for Group 5.
- `docs/touchdesigner-handoff-2026-05-26.md` — operator-level handoff for the hand-particle feature.
- `docs/touchdesigner-resume-2026-05-27.md` — running log of TD work; the single entry point to continue.
- `docs/ai-handoff.md` — concise takeover notes for Claude/Codex.
- `docs/touchdesigner-mcp.md` — how to use the claude-touchdesigner MCP plugin to build TD networks from Claude Code.

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
- [x] Top-8 frequency peak detection from the live bowl mic
- [x] Simulated heartbeat with calming BPM drift and HRV jitter (`useHeartbeat`)
- [x] Chakra color detection from nearest live mic frequency (396–963 Hz)
- [x] Cymatics layer on canvas, ported from teammate's MATLAB `sin(kx) * sin(ky)`
- [x] Full CHAKRA_COLORS table — cymatics render in the detected chakra color; gold default when none
- [x] Heartbeat aura pulse with two-phase animation (80ms attack, 400ms exponential decay — mirrors cardiac wave)
- [x] BPM→color aura mapping: violet (<62), cyan (62–72), amber (72–85), orange (≥85)
- [x] OneEuroFilter on pose landmarks — aura glides instead of snapping
- [x] MediaPipe body anchor tracking for aura positioning
- [x] Wrist anchors for TouchDesigner-style hand/body tracking visuals
- [x] TouchDesigner-inspired white visual field and audio-reactive bloom particles
- [x] Auto-hide control rail (fades after 3s inactivity, returns on mouse/touch/key)
- [x] Dark design system: #06060C background, Cormorant Garamond, glassmorphism panels
- [x] Active poem UI removed
- [x] Responsive layout focused on the visual stage
- [x] claude-touchdesigner MCP plugin installed (v0.1.6) — see `docs/touchdesigner-mcp.md`
- [x] TouchDesigner reactive build (`td/cbl.toe`) — pose bridge (web→TD WS:9980), 2048-particle GPU sim that gathers/scatters from wrists, hand-warped aura, composited with camera/cymatics/aurora to `master_out`. Smoke-tested 2026-05-28 with synthetic pose: 1031/2048 particles to L hand, 1006/2048 to R hand, 0 at center. See `docs/touchdesigner-resume-2026-05-27.md`.

## Pending - Hardware Not Yet Available

| Task | Where to change | Notes |
|---|---|---|
| Arduino pulse sensor -> real BPM | `src/audio/useHeartbeat.ts`; replace `setTimeout` loop with `navigator.serial` reads | Interface (`HeartbeatState`) is already defined; swap only the `useEffect` body |
| Tune bowl chakra detection | `src/audio/useMicInput.ts` | Test with the real bowl/mic and tune frequency/magnitude thresholds if detection jumps |
| Tune visual intensity (web app) | `src/components/CameraStage.tsx` | Test on the demo laptop/projector and adjust white field, bloom particles, aura, and tracking node opacity |
| Live TD test with a person | run web app with `VITE_TD_BRIDGE=1` while `td/cbl.toe` is open | Smoke-tested with synthetic pose; aesthetic feel (gather speed, scatter threshold, glow intensity) still unverified |

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

## Team Task Division (from Meeting 5.2, 2026-05-22)

| Person(s) | Task |
|---|---|
| Joris + Henk | Explain the meaning/narrative of the art for the report |
| Alice | Experiment with bowl frequencies and ranges |
| Arav + Mahiraa + Alejandra | Continue with code |
| Alice + Joris + Henk | Group report (Overleaf) |

Physical materials ordered: Tibetan singing bowl (Alice, Amazon Prime), better Arduino, black cloth for display.

## Constraints

- Physical installation demo on 19 June 2026; code must work on a laptop pointed at a person.
- All 6 disciplines should have a visible role; Arav owns the signal-processing pipeline.
- Budget EUR 100; avoid paid services for the active demo.
- Must work without internet for the demo (poetry is dormant; MediaPipe loads from CDN — test offline or bundle).

## TouchDesigner MCP (AI-Assisted TD Development)

The `claude-touchdesigner` plugin (v0.1.6) is installed globally for Arav's Claude Code.

To use it:
1. Open TouchDesigner, drag in `TouchDesignerAPI.tox` (path in `docs/touchdesigner-mcp.md`)
2. Set Port = 44444 on the component
3. In Claude Code, run `/touchdesigner` to load the skill
4. Ask Claude to build TD networks in natural language

Full setup and pattern reference: `docs/touchdesigner-mcp.md`.
