# Current Status

Date: 2026-05-28

## Repository State

- Branch: `main`
- This note describes the current web app after the MATLAB sound integration, TouchDesigner-inspired visual pass, and poetry-removal pivot.
- Untracked project material exists and should not be deleted without asking:
  - `EngineeringArt CBL/`
  - `EngineeringArt CBL.zip`
  - `engineering-art-design-ai-research.md`
  - `tmp/`

The `EngineeringArt CBL/` folder and zip are teammate work. They contain MATLAB files for microphone FFT, cymatics, camera input, and chakra color mapping.

## Latest Direction Update

Poetry is permanently off the table (confirmed Meeting 5.2, 2026-05-22).

The current project focus is:

```text
visual installation quality + report + physical hardware + bowl sound + body tracking
```

Group is now split: Joris/Henk/Alice writing the report; Arav/Mahiraa/Alejandra on code. Bowl has been ordered. Better Arduino and black display cloth also being sourced.

Old poem-related code can stay as dormant legacy code for now, but new UI work should not build around poems.

## What The App Does Now

The app is a React/Vite browser prototype for an interactive visual installation.

Current experience:

- Webcam feed appears on a canvas (mirrored for selfie view).
- MediaPipe pose tracking finds the person; landmarks smoothed via OneEuroFilter so the aura glides.
- A glowing aura is drawn around the body; color encodes BPM (violet=calm, cyan=resting, amber=neutral, orange=elevated).
- Heartbeat pulse is a two-phase animation (80ms attack / 400ms exponential decay) matching the cardiac pressure wave.
- The microphone can be turned on for bowl input.
- Browser FFT analysis finds strongest bowl frequencies (top 8 peaks).
- The nearest chakra is selected from the teammate frequency/color table (396–963 Hz Solfeggio).
- The cymatics layer renders in the detected chakra color (gold default when none); sin(kx)*sin(ky) via teammate MATLAB formula.
- A TouchDesigner-inspired layer adds white ripple visual field, bloom particles, and visible skeleton/tracking nodes.
- Wrist tracking is exposed from MediaPipe and used for hand/body node visuals.
- Control rail auto-hides after 3s of inactivity; returns on any input.
- The stage status can show detected chakra and approximate frequency.
- The UI has no active poem panel, poem button, or poem overlay.
- Design system: near-void dark background (#06060C), Cormorant Garamond typography, glassmorphism panels.

The visual direction has moved away from the older sample-audio/text prototype and toward a Tibetan singing bowl / heartbeat / cymatics visual installation.

## Important Files

- `src/App.tsx`: main UI state, mic toggle, heartbeat state, signal readouts.
- `src/audio/useMicInput.ts`: browser microphone capture, frequency peaks, and chakra detection.
- `src/audio/useHeartbeat.ts`: simulated heartbeat; later replace with Arduino/Web Serial input.
- `src/audio/audioAnalysis.ts`: audio feature extraction and chakra frequency constants.
- `src/camera/usePoseTracking.ts`: camera pose tracking, including wrist anchors.
- `src/components/CameraStage.tsx`: canvas visuals: camera, aura, cymatics, bloom particles, tracking nodes.
- `src/poetry/poemClient.ts`: dormant legacy poem request client.
- `server/validation.ts`: dormant legacy poem request validation.
- `server/openaiPoem.ts`: dormant legacy OpenRouter/OpenAI poem generation.
- `CLAUDE.md`: architecture note for Claude/Codex handoff.
- `README.md`: current setup, behavior, troubleshooting, and legacy code notes.

## Checks Run

These checks were run on 2026-05-25 after the poetry-removal pivot:

```powershell
npm run lint
```

Result: passed.

```powershell
npm run test
```

Result: passed. 5 test files, 15 tests.

```powershell
npm run build
```

Result: passed.

```powershell
npm run test:e2e
```

Result: passed. The Playwright test starts the bowl mic flow, checks the signal readouts, confirms no active poem text is visible, and verifies the canvas is nonblank.

Browser smoke check:

- Opened `http://127.0.0.1:5173/` with the Browser/Playwright tool.
- Page title: `cbl`.
- Console errors: 0.
- Console warnings: 2 MediaPipe/OpenGL diagnostics during local dev rendering.

## Current Implementation Notes

### 0. TouchDesigner MCP Plugin

The `claude-touchdesigner` MCP plugin (v0.1.6) is installed. See `docs/touchdesigner-mcp.md` for full setup. This lets Claude Code build TouchDesigner networks directly — useful for prototyping GLSL effects and visual ideas before porting them to the canvas. `TDAPI_PORT=44444` is set permanently in Windows user environment variables.

### 0b. TouchDesigner Reactive Build (`td/cbl.toe`)

As of 2026-05-28, `td/cbl.toe` is the **full reactive build** (the prior simpler grid file is
backed up locally as `td/cbl.toe.bak`). It contains:
- Pose bridge — webserverDAT on port 9980 receives wrist/head/torso from the web app
- GPU particle sim — 2048 particles pulled to wrists; gather when still, scatter when moving
- Hand-warped body aura (`aura_warp` glslTOP), BPM/chakra tinted
- Camera + cymatics + aurora layers composited beneath
- Final chain: `comp_aur → comp_bloom(add) → comp_aura(screen) → master_level → master_out`

Three latent bugs were fixed via a synthetic-pose smoke test on 2026-05-28 (commit `5e09fe6`):
`uTorso.x` was unbound (biased the particle home off-center), all of `uSpeed.{x,y,z,w}` were
unbound (scatter-from-fast-hands and audio energy chaos noise were dead), and
`root.time.play` was False (the feedback shader could not iterate). With these fixed,
synthetic hands at u=0.30 and u=0.70 produced **1031 particles toward L hand, 1006 toward
R hand, 0 at center** — exactly what the shader intends. Live test with a person in front
of the camera is still pending. See `docs/touchdesigner-resume-2026-05-27.md` for the
running TD log.

### 1. Active Poetry Was Removed From The UI

`src/App.tsx` no longer imports or calls `requestPoem`.

Removed from the active screen:

- poem panel
- regenerate poem button
- copy poem button
- poem generation status
- floating poem text on the canvas

### 2. Chakra Is Wired Through Live Mic

`useMicInput` exposes:

```text
frequencyPeaks
dominantFrequency
dominantChakra
```

`App` passes those values to `CameraStage` and displays compact signal/frequency readouts in the control rail.

### 3. Cymatics Use The MATLAB Input Logic

`CameraStage` still renders an artistic layer, but its shape now comes from real frequency peaks.

The key teammate formula is preserved:

```text
k = frequency / 80
pattern += magnitude * sin(k * X) * sin(k * Y)
```

### 3b. Design System Overhaul

Following Meeting 5 feedback ("UI is too cutesy"), the visual language was overhauled:
- Background changed to `#06060C` (near-void dark) so glowing effects read as light from darkness
- Typography changed to Cormorant Garamond (weights 300/400/500) from Google Fonts
- UI panels use glassmorphism (`rgba(5,5,20,0.42)` + `backdrop-filter: blur(8px)`)
- Panel borders changed to soft violet `rgba(177,121,210,0.3)` to match aurora palette
- Control rail auto-hides after 3s inactivity via smooth 1200ms cubic-bezier ease-out

### 4. TouchDesigner Reference Pass

Reference:

- https://vm.tiktok.com/ZGdHggUDC/
- resolved: https://www.tiktok.com/@studio.kashi/video/7617655149653167390

Goal:

Use the TikTok's TouchDesigner learning path as visual direction while keeping this as a React web app.

Implemented:

- white abstract visual field
- audio-reactive bloom particles
- wrist/shoulder/head tracking rings and lines
- chakra/frequency status text

Full details: `docs/touchdesigner-reference.md`.

### 5. Remaining Practical Risk

The integration is covered by automated tests, but the frequency thresholds and visual strength still need real-room testing with the actual bowl, microphone, camera, and projector.

## Recommended Next Development Order

1. Test with the real bowl and mic.
2. Tune `MIN_PEAK_FREQUENCY`, `MAX_PEAK_FREQUENCY`, `PEAK_SPACING_HZ`, and `MIN_DOMINANT_MAGNITUDE` in `src/audio/useMicInput.ts` if chakra detection is unstable.
3. Test wrist tracking with hands visible in the camera.
4. Tune the TouchDesigner-inspired visual intensity in `src/components/CameraStage.tsx` if the stage still looks too subtle.
5. Keep `README.md` and `docs/` updated after demo-room testing.
