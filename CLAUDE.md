# CBL - Creative Bowl Lab

TU/e Multi-Disciplinary CBL course project, Group 5, Year 2 Q4 2025-2026.
**Final presentation:** 19 June 2026.

## Current Concept

Tibetan singing bowl -> physically alters person's heartbeat -> (Arduino pulse sensor, coming) -> **TouchDesigner renders the installation**:

- Body aura warped/tinted toward the hands, pulsing with each beat; color encodes BPM (violet=calm, cyan=resting, amber=neutral, orange=elevated)
- GPU hand-particle system (2048 particles) that gathers to still hands and scatters from fast ones
- Cymatics interference pattern, shaped by bowl mic frequencies, colored by detected chakra
- Aurora ribbons + chakra color response from the teammate frequency table (396–963 Hz Solfeggio scale)

**PRIMARY SYSTEM = TouchDesigner, standalone (decided 2026-05-29).** The 19 June demo
runs as **one surface (TD) on one webcam** — TD does the camera, MediaPipe body/hand
tracking, particles, aura, cymatics, aurora, and chakra audio, on the GPU, from a
single laptop, **with no browser open**. Authoritative architecture:
`docs/touchdesigner-onesurface-2026-05-27.md`.

The React/Vite **web app is a kept-but-secondary dev tool / reversible fallback** — not
launched at the demo, and the show does not depend on it. (It originally rendered the
visuals on a 2D canvas and streamed pose to TD over a WebSocket; that browser→TD bridge
is retired because the browser had to stay open *and in focus*, and it fought TD for the
camera. See the one-surface doc.)

**Direction as of 2026-05-25 (Meeting 5.2):** Poetry is permanently off the table. Keep old poetry files as dormant legacy code only.

## Running The Project

**The installation (TouchDesigner, standalone — this is the demo):**

```powershell
# Open the build; stand in front of the webcam. No browser.
& "C:\Program Files\Derivative\TouchDesigner\bin\TouchDesigner.exe" "C:\projects\CBL\td\cbl.toe"
# On the demo laptop, enable the live bowl mic by pasting td/enable_bowl_audio.py into the Textport.
```

Full runbook + boot-hang reboot rule: `docs/touchdesigner-onesurface-2026-05-27.md` and `memory/touchdesigner_setup.md`.

**The web app (secondary dev tool / fallback):**

```powershell
npm install
npm run dev        # Vite app on :5173, legacy Express API on :8787
npm test           # Vitest tests
npm run build      # TypeScript check + Vite production build
```

No API key is required. No browser is needed for the demo.

## Architecture

**Primary: TouchDesigner network `/project1/cbl`** (operator map in `td/README.md`):

```text
camera_in (videodeviceinTOP)  - laptop webcam; feeds both the display chain and pose_mp
pose_mp (scriptCHOP)          - MediaPipe PoseLandmarker (LIVE_STREAM) in TD's own Python
                                (td/mp_engine.py + td/pose_mp_callbacks.py, models in td/models/);
                                emits lWrist/rWrist/head/torso _u/_v/_c (+ wrists _spd) into `pose`
p_sim / p_geo / p_render      - 2048-particle GPU feedback sim; gather to still hands, scatter from fast
aura_warp (glslTOP)           - body aura domain-warped toward the hands, BPM/chakra tinted
cymatics (glslTOP)            - chakra-colored sin(kx)*sin(ky) interference
aurora (glslTOP)              - 4 BPM-tinted light ribbons
audio_out (scriptCHOP)        - bowl spectrum -> nearest Solfeggio (396–963 Hz) -> peakHz/hue/energy/chakra
heartbeat (lfoCHOP)           - ~70 BPM sim pulse until the Arduino arrives
composite -> master_out       - void -> camera -> +cymatics -> +aurora -> +particles -> screen aura -> projector
```

NOTE: as of 2026-05-29 `cbl.toe` sources `pose` from the **TD-native `pose_mp`** scriptCHOP
(the browser `pose_ws` bridge is kept but disconnected for easy revert). Verified live with
no browser: head/torso tracked at 0.97/0.99 confidence straight from `camera_in`.

**Secondary: React/Vite web app** (kept as a dev tool / fallback; mirrors the same visual
language on a 2D canvas). `useMicInput` (FFT peaks + chakra), `useHeartbeat` (simulated
70→62 BPM), `useCamera` + `usePoseTracking` (MediaPipe), `CameraStage` (canvas pipeline:
void → camera → white field → cymatics → aurora → aura → bloom particles → tracking nodes →
frequency bars). `src/net/usePoseStream.ts` is the retired pose→TD bridge, gated OFF unless
`VITE_TD_BRIDGE=1`. Legacy poem server/client is dormant.

## Reference Docs

- **`docs/touchdesigner-onesurface-2026-05-27.md` — START HERE. The authoritative standalone (TD-primary) architecture.**
- `docs/touchdesigner-resume-2026-05-27.md` — running log of TD work; the single entry point to continue building.
- `td/README.md` — TouchDesigner operator map for `/project1/cbl`.
- `docs/touchdesigner-handoff-2026-05-26.md` — operator-level handoff for the hand-particle feature.
- `docs/touchdesigner-for-teammates.md` — plain-language TD explainer for Group 5.
- `docs/touchdesigner-mcp.md` — how to use the claude-touchdesigner MCP plugin to build TD networks from Claude Code.
- `docs/index.md` — doc index.
- `docs/current-status.md` — current state and known risks.
- `docs/ai-handoff.md` — concise takeover notes for Claude/Codex.
- `docs/matlab-integration-ideation.md` — teammate MATLAB integration rationale.
- `docs/touchdesigner-reference.md` — original TikTok reference (the canvas-translation pass; now superseded by the TD-primary direction).

## Key Files

| File | Purpose |
|---|---|
| `src/audio/useHeartbeat.ts` | Simulated heartbeat; swap body for Web Serial API reads when Arduino arrives |
| `src/audio/useMicInput.ts` | Live mic capture for bowl audio, FFT peaks, nearest chakra |
| `src/audio/audioAnalysis.ts` | Goertzel chakra detection (396-963 Hz), band energy, BPM estimation |
| `src/camera/usePoseTracking.ts` | MediaPipe pose tracking, including wrist anchors for hand-tracking visuals |
| `src/components/CameraStage.tsx` | Canvas rendering: camera, aura, cymatics, bloom particles, tracking nodes |
| `src/App.tsx` | Main visual app shell, mic toggle, heartbeat state, signal readouts |
| `td/cbl.toe` | **The installation.** TD network `/project1/cbl` (particles, aura, cymatics, aurora, composite → `master_out`) |
| `td/mp_engine.py` | **TD-native** MediaPipe PoseLandmarker (LIVE_STREAM async); makes TD self-sufficient (no browser) |
| `td/pose_mp_callbacks.py` | `pose_mp` scriptCHOP — feeds TD's own camera to `mp_engine`, emits the same channels as the retired web bridge |
| `td/models/*.task` | Bundled MediaPipe models (offline; committed) |
| `td/pylibs/` | Vendored Python runtime (git-ignored; recreate via `pip install -r td/requirements.txt --target td/pylibs`) |
| `td/aura_warp.frag` | Hand-warped body-aura GLSL shader |
| `td/enable_bowl_audio.py` | Adds the live bowl mic on the demo laptop (kept out of the saved `.toe` — it hangs TD) |
| `src/net/usePoseStream.ts` | Retired web→TD pose bridge (gated OFF unless `VITE_TD_BRIDGE=1`) |
| `src/poetry/poemClient.ts` / `server/openaiPoem.ts` / `server/validation.ts` | Dormant legacy poem code; not imported by the app |

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
- [x] TouchDesigner reactive build (`td/cbl.toe`) — 2048-particle GPU sim that gathers/scatters from wrists, hand-warped aura, composited with camera/cymatics/aurora to `master_out`. Smoke-tested 2026-05-28 with synthetic pose: 1031/2048 to L hand, 1006/2048 to R hand, 0 at center. See `docs/touchdesigner-resume-2026-05-27.md`.
- [x] **TD-native pose engine recovered + committed (2026-05-29)** — `td/mp_engine.py` + `td/pose_mp_callbacks.py` run MediaPipe inside TD's Python with bundled offline models; this is what makes TD self-sufficient (no browser). Built in a prior session, never committed; now in git. See `docs/touchdesigner-onesurface-2026-05-27.md`.
- [x] **Seamless flowing-colour redesign (2026-05-29)** — smooth cymatics (no dot-grid), liquid/ink feedback flow (`flow`/`flow_fb`, advect+inject, composited over the camera so the person stays sharp), and 10-fingertip glowing orbs (`orbs` + `hands_mp` via `td/hand_mp_callbacks.py` + hand_landmarker) that trail/dissolve into the flow. Colour driven by bowl hue + heartbeat + ambient drift. Verified live. Spec: `docs/touchdesigner-visual-redesign-2026-05-29.md`.

## Pending

| Task | Where to change | Notes |
|---|---|---|
| ~~Wire TD standalone (Track B)~~ — **DONE 2026-05-29** | `td/cbl.toe` | `pose_mp` placed + wired (loads `td/pose_mp_callbacks.py`), `pose` repointed to it, `camera_in` confirmed live. Verified: head/torso 0.97/0.99, no browser. |
| ~~Live aesthetic check~~ — **DONE 2026-05-29** | `td/cbl.toe` | Particles track both hands (gather/scatter); tuned `comp_bloom` add→screen (violet, not white-out) + `camera_level` brighter. |
| **Background segmentation (next visual upgrade)** | new scriptTOP in `td/cbl.toe` | Drop the room so the person floats on black (removes the ceiling "wedge", makes the person pop). `mp_engine` already computes the body mask. Full build steps + the flip-alignment gotcha: `docs/touchdesigner-segmentation-2026-05-29.md`. **Needs TD open + a person.** |
| ~~Visual redesign: dot-grid → seamless flowing colour~~ — **DONE 2026-05-29** | `td/cbl.toe` | Smooth cymatics + liquid/ink feedback flow + 10-fingertip glowing orbs (hand_landmarker) blended into the flow. Verified live. Spec: `docs/touchdesigner-visual-redesign-2026-05-29.md`. |
| Arduino pulse sensor -> real BPM | TD `heartbeat` LFO → `serialCHOP` (and `src/audio/useHeartbeat.ts` for the web fallback) | Output channel must stay named `beat` |
| Tune bowl chakra detection | `td/audio_out` (and `src/audio/useMicInput.ts` for the web fallback) | Test with the real bowl/mic and tune thresholds if detection jumps |

## Teammate Contributions (`EngineeringArt CBL/`)

- `frequency_colours.csv` -> `CHAKRAS` constant in `audioAnalysis.ts`
- `goertzel_analysis.m` -> `goertzelMagnitude()` in `audioAnalysis.ts`
- `chladni_simulation.m` -> `drawCymaticsPattern()` in `CameraStage.tsx`
- `camera_input.m` -> maps to existing `useCamera.ts`

## Visual Reference

The user shared this TikTok and asked to follow the tutorial/reference:

- https://vm.tiktok.com/ZGdHggUDC/
- resolved: https://www.tiktok.com/@studio.kashi/video/7617655149653167390

Original implementation decision (now superseded): translate the TouchDesigner learning path into React canvas visuals. **As of 2026-05-29 the project builds the installation in TouchDesigner itself** (the learning path realized in the real tool), with the web app kept as a fallback.

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
- Must work without internet for the demo. The TD path is already offline-safe — MediaPipe models are bundled in `td/models/`. (The web fallback still loads MediaPipe from a CDN, so it would need bundling if used at the demo.)

## TouchDesigner MCP (AI-Assisted TD Development)

The `claude-touchdesigner` plugin (v0.1.6) is installed globally for Arav's Claude Code.

To use it:
1. Open TouchDesigner, drag in `TouchDesignerAPI.tox` (path in `docs/touchdesigner-mcp.md`)
2. Set Port = 44444 on the component
3. In Claude Code, run `/touchdesigner` to load the skill
4. Ask Claude to build TD networks in natural language

Full setup and pattern reference: `docs/touchdesigner-mcp.md`.
