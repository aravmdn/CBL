# CBL TouchDesigner Project

`cbl.toe` is the GPU visual installation built for the Creative Bowl Lab demo — and
**the primary system** for 19 June. It does the deep-void + chakra-colored cymatics +
BPM-tinted aurora, plus a GPU **hand-particle system** and a **hand-warped body aura**,
all on the GPU for projector output. It is designed to run **standalone on one webcam
with no browser** (see `pose_mp` below and `docs/touchdesigner-onesurface-2026-05-27.md`).
The earlier simpler grid version of cbl.toe is backed up locally as `cbl.toe.bak`.

## Open it

1. Open TouchDesigner (2025+) and open `td/cbl.toe`
   (double-click, or `File > Open`). The `TouchDesignerAPI` component on
   port **44444** auto-starts, so Claude Code's `claude-touchdesigner` MCP
   connects immediately.
2. The final image is `/project1/cbl/master_out` (1280×720). Right-click it →
   *View* for a fullscreen preview, or wire it to a Window COMP for the projector.

## Network (`/project1/cbl`)

| Operator | Role |
|---|---|
| `void` | constant TOP, deep-void base `#06060C` |
| `camera_in → camera_flip → camera_level → camera_out` | webcam, mirrored selfie view, darkened |
| `cymatics` (glslTOP) | chladni `sin(kx)·sin(ky)` interference, chakra-colored, aspect-correct |
| `aurora` (glslTOP) | 4 undulating BPM-tinted light ribbons |
| `pose_ws → pose_ws_cb → pose_raw → pose` | **pose bridge**: webserverDAT (port 9980) receives wrist/head/torso JSON from the web app; scriptCHOP smooths + computes per-hand speeds; `pose` nullCHOP is the public read point |
| `p_init / p_fb / p_sim / p_null / p_chop / p_ctsop / p_geo / p_render / p_mat / p_sprite / p_quad / p_qnull / p_cam` | **GPU particle system**: 2048 particles in a GLSL feedback sim; gather to still hands, scatter from fast ones. `p_render` is the rendered particle layer |
| `aura_warp` (glslTOP) | **hand-warped body aura**: radial torso glow domain-warped toward each hand, BPM/chakra tinted |
| `comp_cam / comp_cym / comp_aur / comp_bloom / comp_aura` | composite chain: camera *over* void → +cymatics → +aurora → +p_render (add) → screen with aura_warp |
| `master_level → master_out` | color correct + final null (preview / projector feed) |
| `audio_out` (scriptCHOP) | **chakra core**: bowl spectrum → nearest Solfeggio (396–963 Hz) → `peakHz / hue / energy / chakra`. Input is OPTIONAL — no input = safe defaults |
| `heartbeat` (lfoCHOP) | 1.17 Hz (~70 BPM) sim pulse; drives the beat scaling until the Arduino arrives |

The shader uniforms on `cymatics` / `aurora` / `aura_warp` / `p_sim` are
expressions reading `pose`, `audio_out`, and `heartbeat`, so the whole stage
reacts to sound + pulse + hands with no extra wiring.

## Pose source: standalone (the demo) vs. browser bridge (retired)

Two ways to drive the `pose` channels that the particles + aura read:

1. **Standalone, TD-native (the demo path).** TD does its own MediaPipe pose tracking:
   `td/mp_engine.py` (PoseLandmarker, LIVE_STREAM async) + the `pose_mp` scriptCHOP
   (`td/pose_mp_callbacks.py`) reading TD's own `camera_in`. Models bundled in
   `td/models/` (offline). No browser, no WebSocket, no camera contention. Recreate the
   Python runtime once per clone: `pip install -r td/requirements.txt --target td/pylibs`.

   **Open Track B:** the `pose_mp` scriptCHOP isn't placed in `cbl.toe` yet — place it and
   repoint the public `pose` read point from the `pose_ws` chain to `pose_mp` (it emits the
   same channel names, so downstream uniforms don't change). See
   `docs/touchdesigner-onesurface-2026-05-27.md`.

2. **Browser bridge (retired fallback).** Open `td/cbl.toe`, then:
   ```powershell
   $env:VITE_TD_BRIDGE = '1'; npm run dev
   ```
   (or in devtools: `localStorage['td-bridge']='1'`, reload). Open http://localhost:5173,
   allow camera; `pose_ws` shows 1 client and the `pose` channels track your hands. **This
   is retired for the demo** — it requires the browser to stay open *and in focus* and it
   competes with TD for the webcam.

## Enable the live bowl mic

`cbl.toe` ships WITHOUT a live audio-device op on purpose (see gotcha below).
To turn on real chakra detection on the demo laptop, run `enable_bowl_audio.py`
(paste into the Textport, or run via MCP `td_execute`). It adds
`bowl_mic → spectrum` and feeds the spectrum into `audio_out`.

## Swap the simulated heartbeat for the Arduino

`heartbeat` is an LFO standing in for the pulse sensor. When the Arduino arrives,
replace it with a `serialCHOP` that parses BPM, and rename its output channel to
`beat` (or repoint the `cymatics`/`aurora` `vec1valuez` expressions).

## Gotchas (learned the hard way)

- **Do NOT save with a live `audiodeviceinCHOP` in the network on a machine
  whose audio driver is flaky.** TD enumerates audio devices during
  `project.save()` and can HANG (UI stays responsive, but the HTTP/MCP server
  freezes). Call `disable_bowl_audio()` before saving on such a machine.
- **`project.save('cbl.toe')` returns `False` and does NOT overwrite an existing
  file** via the non-interactive MCP API (it auto-declines the overwrite prompt).
  Delete the file first, then save — or save to a new name. `cbl.*.toe` are TD's
  auto-increment backups and are git-ignored.
