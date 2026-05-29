# TouchDesigner — One Surface (the standalone architecture)

_Created 2026-05-29. (The filename is dated 2026-05-27 because `td/mp_engine.py`
already referenced this path before the doc existed — this is that doc.)_

**This is the authoritative architecture for the project. TouchDesigner is the
primary system. The browser is no longer part of the demo.**

## The decision

The 19 June installation runs as **one surface (TouchDesigner) on one webcam**.
TD does the camera feed, the body/hand tracking, the particles, the aura, the
cymatics, the aurora, and the audio/chakra detection — all on the GPU, all from a
single laptop, with **no browser open**.

The React/Vite web app is **kept in the repo as a dev tool / reversible fallback**,
but it is not launched at the demo and nothing in the show depends on it.

### Why (this is what the live test proved)

The earlier design fed TD from the browser over a WebSocket (`pose_ws` on :9980).
A live test with a person exposed two problems that are *inherent* to that design:

1. **Frozen camera in TD.** With the browser open, its `getUserMedia` grabbed the
   single webcam, so TD's own camera capture was starved and showed a stale/frozen
   frame — even though the hand effects still reacted.
2. **The browser tab had to stay open and in focus.** Browsers throttle background
   tabs (`requestAnimationFrame` / `getUserMedia` pause), so the pose stream to TD
   went stale and the effects froze whenever the tab lost focus.

Both vanish when TD owns the camera and does its own pose tracking. That is the
"one surface" design below.

## The recovered engine (built in a prior session, now committed)

A previous session built TD-native pose tracking but it was never committed or
documented. It is now committed and is the core of this architecture:

| File | Role |
|---|---|
| `td/mp_engine.py` | MediaPipe **PoseLandmarker in LIVE_STREAM (async)** mode running inside TD's Python. Never blocks the render thread. Loads `td/models/pose_landmarker_full.task`. |
| `td/pose_mp_callbacks.py` | The `pose_mp` **scriptCHOP**: reads TD's own `camera_in` TOP, downscales to 384×216, feeds frames to `mp_engine`, reads the latest async result, EMA-smooths (~80 ms), and emits the **same channels as the retired browser bridge** — `lWrist_/rWrist_/head_/torso_` `_u/_v/_c` (+ wrists `_spd`). Coords: `u = 1 - x` (selfie mirror), `v = 1 - y`. |
| `td/models/*.task` | MediaPipe models bundled for **offline** use (no internet at the demo). |
| `td/pylibs/` | Vendored Python runtime (mediapipe, opencv, numpy). **Git-ignored** (~286 MB); recreate with `pip install -r td/requirements.txt --target td/pylibs`. |
| `td/aura_warp.frag` | The hand-warped body-aura GLSL shader. |
| `td/resume_build.py` | One-time build helpers (`diagnose/fix_particles/build_aura/composite`) used to assemble the particle + aura chain. |

## Data flow (standalone)

```text
laptop webcam ──► camera_in (videodeviceinTOP)
                    ├─► display chain (camera_flip → camera_level → camera_out)
                    └─► pose_mp (scriptCHOP, MediaPipe in TD Python)
                          └─► pose channels (lWrist/rWrist/head/torso _u/_v/_c/_spd)
                                ├─► p_sim (GPU particle feedback): gather to still
                                │     hands, scatter from fast hands (uSpeed), home
                                │     biased by uTorso
                                └─► aura_warp (hand-warped body glow)

bowl mic ──► spectrum ──► audio_out (chakra core: peakHz / hue / energy / chakra)
                                └─► tints cymatics + aurora
heartbeat (LFO ~70 BPM) ──► beat scaling (until the Arduino arrives)

composite: void → camera → +cymatics → +aurora → +p_render(add) → screen aura_warp
           → master_level → master_out   (projector feed, 1280×720)
```

The only change vs. the committed `cbl.toe` is the **pose source**: `pose_mp`
(TD-native) replaces the `pose_ws → pose_ws_cb → pose_raw` browser bridge. Because
`pose_mp` emits the identical channel names into the public `pose` read point, every
downstream uniform on `p_sim` / `aura_warp` keeps working unchanged.

## Run it (browser-free, one laptop)

1. Launch TD on the build:
   ```powershell
   & "C:\Program Files\Derivative\TouchDesigner\bin\TouchDesigner.exe" "C:\projects\CBL\td\cbl.toe"
   ```
2. Confirm it booted healthy (window up, RAM climbing past ~600 MB, port 44444
   listening). See `memory/touchdesigner_setup.md` for the boot-hang reboot rule.
3. Stand in front of the webcam — `pose_mp` channels track your hands; particles
   gather/scatter and the aura warps. **No browser.**
4. Enable the live bowl mic on the demo laptop (paste `td/enable_bowl_audio.py`
   into the Textport). Keep `cbl.toe` saved **without** a live audio op (it hangs TD
   on this machine — see the setup memory).
5. `master_out` is the projector feed.

## Status

**Done & committed:** the standalone pose engine, offline models, aura shader, and
the particle/aura build in `td/cbl.toe` (smoke-tested with synthetic pose:
1031 → L hand, 1006 → R hand, 0 at center).

**Pending (Track B — needs TD open on MCP :44444 + a person, browser closed):**
1. Place the `pose_mp` scriptCHOP in `/project1/cbl` (load `td/pose_mp_callbacks.py`).
2. Repoint the public `pose` read point from the `pose_ws` bridge to `pose_mp`.
3. Confirm `camera_in` is a live `videodeviceinTOP` selecting the laptop webcam.
4. Verify live with a person, browser closed: camera **live, not frozen**; particles
   and aura react to real hands.
5. `CheckErrors(recurse=True)` clean → save (mic-free), then enable audio at runtime.
6. Tune aesthetics on the projector (gather speed, scatter threshold, glow).

The running operator-level log is `docs/touchdesigner-resume-2026-05-27.md`; the
operator map is `td/README.md`.
