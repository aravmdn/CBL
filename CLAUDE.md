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
cymatics (glslTOP)            - Chladni square-plate figure (Ritz superposition); CONTINUOUS morph
                                between (n,m) modes driven by bowl pitch (no snapping); chakra-tinted
aurora (glslTOP)              - 4 BPM-tinted light ribbons
audio_out (scriptCHOP)        - bowl spectrum -> TRUE dominant pitch (peakHz, harmonic-product-spectrum
                                on a LINEAR spectrum) + energy; hue/chakra = nearest Solfeggio
                                (396–963 Hz) for COLOUR only (not snapped for the figure). The mic +
                                `spectrum` are added on demand by enable_bowl_audio.py (forces linear mode)
heartbeat (lfoCHOP)           - pulse rate from live Arduino BPM (COM7) via pulse_serial→...→bpm_smooth;
                                ALWAYS breathes (amp 0.55 resting-sim / 1.0 full pulse on a live sensor)
composite -> master_out       - void -> camera -> +flow(cymatics+aurora+orbs feedback) -> +aura -> +fingertip orbs -> screen
                                (NOTE: the discrete p_sim/p_render particles are DORMANT — not composited; the
                                 flowing-ink layer now carries the Chladni effect. See chladni-implementation doc.)
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
- `docs/touchdesigner-chladni-particles-2026-06-01.md` — research paper (Rossing 1982 / Ritz 1909) + full breakdown of the Factory Settings Chladni video + graft plan.
- `docs/touchdesigner-chladni-implementation-2026-06-09.md` — **as-built Chladni math** in `cymatics`: plain-language maths, bowl/heartbeat→(n,m,L) mapping, tuning guide. §11 covers the 2026-06-16 pitch-detector fix + continuous morph + modes-decoupled-from-loudness.
- `docs/touchdesigner-heartbeat-serial-2026-06-09.md` — **live heartbeat serial diagnosis + migration plan**: the DTR+RTS gotcha (TD got 0 bytes until both enabled), COM7 (not COM5), board reset/re-enumeration, live BPM verified, sensor-flakiness-is-hardware, and the plan to move beat detection off the Arduino into TD.
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
- [x] **Chladni square-plate math implemented in `cymatics` (2026-06-09)** — replaced the old separable `sin(kx)·sin(ky)` grid with the true two-mode superposition `cos(nπx/L)cos(mπy/L) − cos(mπx/L)cos(nπy/L)` (Ritz 1909), rendering glowing nodal lines ("sand on the plate"). `uMode=(n,m,breathScale,phase)` on vec3: bowl `peakHz → (n,m)`, `heartbeat → breathing`, chakra hue unchanged. Verified live (figures at (3,5)/(5,8) correct), network error-free, saved mic-free. This is Option A of the Chladni graft plan. Spec: `docs/touchdesigner-chladni-implementation-2026-06-09.md`.
- [x] **Chladni Option B — flowing ink settles on the nodal lines (2026-06-09)** — the video's headline effect, done as a flow variant (not discrete particles, per choice). New `chladni_height → chladni_thr → chladni_nrm` (Normal TOP velocity field) feeds the `flow` shader; `uChladni.x` gain (gated by bowl `energy`) advects the flowing ink onto the nodal lines and suppresses the ambient warp so the figure reads. Bowl ring → ink snaps into the Chladni figure; quiet → ambient flow (fully gated/reversible). A/B-verified live, error-free, saved mic-free. Spec: chladni-implementation doc §7.
- [x] **Alejandra's Chladni techniques ported into `cymatics` (2026-06-12)** — teammate Alejandra's standalone Chladni `.toe` (now at `td/experiments/alejandra-chladni/`) analyzed and three techniques grafted onto our layer: (1) **soft Gaussian glow** — `cymatics_pixel` nodal term `1.0-smoothstep(0,0.05,|f|)` → `exp(-f*f/0.005)`; (2) **idle attract** — when the bowl is quiet (`energy≤0.02`), `n`/`m` on `cymatics` + `chladni_height` slow-cycle integer figures (`n=3+int(t/6)%5, m=n+3`), snapping to `peakHz` on a strike; (3) **sand-grain layer** — new `chladni_sand` (glslmulti, our `−` chladni + shared `uMode`) + `chladni_sand_fb` (feedback) + `comp_sand` (add into `comp_bloom`), bowl-gated `uGain` with a small idle floor; flow-gather eased so grain+flow don't double up. MCP-built, error-free recursively, saved mic-free (29610→31074 B). Spec: `docs/touchdesigner-chladni-implementation-2026-06-09.md` §10 + `docs/touchdesigner-alejandra-chladni-port-2026-06-12.md`. **Pending: live aesthetic tuning with the real bowl.**
- [x] **Live heartbeat → TD wired in software (2026-05-29)** — teammate Arduino pulse-sensor work integrated. New chain in `cbl.toe`: `pulse_serial` (serialDAT, **OFF** in the saved file) → `pulse_callbacks` (tolerant parser, accepts both teammate sketches' formats) → `bpm_raw` (constantCHOP, holds last good BPM, resting default 70) → `bpm_smooth` (lagCHOP) → `heartbeat.frequency = max(0.3, bpm_smooth['bpm']/60)`. All 5 existing `beat` consumers untouched. Verified by injecting fake serial lines (parse + junk-rejection confirmed). Demo-laptop enable: `td/enable_pulse_serial.py`. Recommended firmware (merge of both sketches, clean continuous output): `td/arduino/heartbeat_stream/heartbeat_stream.ino`. **LIVE-VERIFIED 2026-06-09** (board streams 62.6 BPM on COM7; serialDAT needs both `dtr`+`rts`). **Amp fallback updated 2026-06-16:** `heartbeat.amp = 1.0 if a BPM frame arrived within ~5s else 0.55`, so a live sensor gives a full-strength pulse at the real rate and no/dropped sensor still breathes gently on the resting sim (was gated to 0 = dead). See `docs/touchdesigner-heartbeat-serial-2026-06-09.md`.
- [x] **Real pitch detection + frequency-driven morphing figure & aura (2026-06-16)** — `audio_out` was frozen at `peakHz≈220` because `spectrum` was in log/visual mode (`frequencylog=1`+`highfreqboost=0.75`) → wrong bin→Hz axis. Forced **linear** spectrum + rewrote the detector (band-local noise floor + harmonic-product-spectrum + parabolic interp); `peakHz` now tracks true pitch ~120–2000 Hz and rejects silence/noise. `enable_bowl_audio.py` now sets the linear mode every session (mic/spectrum aren't saved). **Chladni figure now MORPHS** continuously between bracketing integer figures (`chladniMorph` bilinear crossfade; `chladni_mode_src`→`chladni_mode_lag` feed float n,m) instead of snapping; modes follow `peakHz` at **any loudness** (decoupled from the old `energy>0.10` gate; idle drift only after ~6s of true silence via `chladni_silence`/`_lag`); brightness floor raised so the figure is always legible. **Aura now reacts to pitch** (`flow`: finer/faster swirls on higher notes via `pitch_src`/`pitch_lag`→`uPitch`); fixed a **stutter** where the shader multiplied ever-growing `absTime` by a changing rate (phase jumped) — flow time now comes from an integrated phase (`flow_phase` speedCHOP). **Finger→aura control** made snappier/grippier (`hands_lag` 0.06→0.04; `uFingerCfg` radius/force/dye up; fade 0.96). MCP-built, 0 errors, saved + committed (`4897f88`,`09ca746`). Spec: `docs/touchdesigner-chladni-implementation-2026-06-09.md` §11. **Pending: live aesthetic tuning with the real bowl in a quiet room.**

## Pending

| Task | Where to change | Notes |
|---|---|---|
| ~~Wire TD standalone (Track B)~~ — **DONE 2026-05-29** | `td/cbl.toe` | `pose_mp` placed + wired (loads `td/pose_mp_callbacks.py`), `pose` repointed to it, `camera_in` confirmed live. Verified: head/torso 0.97/0.99, no browser. |
| ~~Live aesthetic check~~ — **DONE 2026-05-29** | `td/cbl.toe` | Particles track both hands (gather/scatter); tuned `comp_bloom` add→screen (violet, not white-out) + `camera_level` brighter. |
| **Background segmentation (next visual upgrade)** | new scriptTOP in `td/cbl.toe` | Drop the room so the person floats on black (removes the ceiling "wedge", makes the person pop). `mp_engine` already computes the body mask. Full build steps + the flip-alignment gotcha: `docs/touchdesigner-segmentation-2026-05-29.md`. **Needs TD open + a person.** |
| ~~Visual redesign: dot-grid → seamless flowing colour~~ — **DONE 2026-05-29** | `td/cbl.toe` | Smooth cymatics + liquid/ink feedback flow + 10-fingertip glowing orbs (hand_landmarker) blended into the flow. Verified live. Spec: `docs/touchdesigner-visual-redesign-2026-05-29.md`. |
| ~~Arduino pulse sensor → real BPM (TD software)~~ — **DONE 2026-05-29** | `td/cbl.toe` | `pulse_serial`→`pulse_callbacks`→`bpm_raw`→`bpm_smooth`→`heartbeat.frequency`. `beat` channel unchanged. Serial OFF in saved file; enable via `td/enable_pulse_serial.py`. |
| ~~Arduino: flash firmware + verify live BPM~~ — **LIVE-VERIFIED 2026-06-09** | `td/enable_pulse_serial.py` (committed `6364ddf`) | Board streams clean BPM (62.63 resting) at 115200 on **COM7**; `heartbeat` LFO tracked it live. **Root fix: TD `serialDAT` needs BOTH `dtr` AND `rts` enabled** — native-USB board discards TX otherwise (got 0 bytes). Default port COM7 (COM3-6 are Bluetooth). Enable once + leave open (open/close resets the board). Full writeup: `docs/touchdesigner-heartbeat-serial-2026-06-09.md`. |
| **Move beat detection Arduino → TD (kill the compile loop)** — *proposed, awaiting go-ahead* | new `td/arduino/heartbeat_raw/heartbeat_raw.ino` + rewritten `pulse_callbacks` | Arduino becomes a dumb firehose (`Serial.println(sensor.getIR())` ~100/s, never recompiled); TD does finger-detect + beat-detect + BPM + smoothing in Python (live-tunable, diagnosable). Same `bpm_raw→bpm_smooth→heartbeat` chain. New MAX30102 (TinyTronics, same chip) drops in. No `pyserial` in TD → detect in the `onReceive` callback. Plan in the heartbeat-serial doc. |
| Tune bowl chakra detection | `td/audio_out_callbacks` (and `src/audio/useMicInput.ts` for the web fallback) | Detector rewritten 2026-06-16 (true pitch, linear spectrum) — `peakHz`/`chakra` now track real pitch. Remaining: confirm chakra hues feel right with the real bowl. |
| **Live aesthetic tuning with the real bowl (quiet room)** — *all the 2026-06-16 work is logic-verified but not aesthetically tuned in front of the real bowl* | `td/cbl.toe` | Knobs: figure silence-floor `chladni_silence` (0.020) + dwell `chladni_silence_lag.lag1` (6s); figure brightness floor (0.55) in `cymatics_pixel`; pitch→aura-speed gain in `flow_rate` (`*0.5`); finger `hands_lag`/`uFingerCfg`. Room was noisy during the build (ambient energy ≈0.04–0.06); reads cleaner with a sustained bowl tone in a quiet space. Steps in chladni-implementation doc §11. |

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
