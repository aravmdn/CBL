# CBL TouchDesigner Project

`cbl.toe` is the GPU visual installation built for the Creative Bowl Lab demo — and
**the primary system** for 19 June. It renders the live camera under a **flowing-ink aura**
(`flow`, which you stir with your fingers), a **Chladni cymatics figure** that **morphs
continuously between patterns with the bowl's pitch**, BPM-tinted aurora ribbons, and a
sand-grain layer, composited to `master_out` for projector output. It runs **standalone on
one webcam with no browser** (TD-native pose/hand tracking — see `pose_mp` below and
`docs/touchdesigner-onesurface-2026-05-27.md`). The discrete 2048-particle system and the
wrist `aura_warp`/`orbs` layers are **dormant / not composited** (kept for reference/revert).
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
| `camera_in → camera_flip → camera_level → camera_out` | webcam, mirrored selfie view (`flipx`), darkened |
| `pose_mp` (scriptCHOP) | **TD-native MediaPipe pose** (`td/pose_mp_callbacks.py` + `td/mp_engine.py`); emits wrist/head/torso `_u/_v/_c`. `pose` null = public read point. (Browser `pose_ws` bridge kept but disconnected.) |
| `hands_mp → hands_lag → hands_vel` | **TD-native MediaPipe hands** (`hands_mp_cb`): 10 fingertips (`u=1-x`,`v=1-y`); lag-smoothed; `hands_vel` (slopeCHOP) = finger velocity |
| `audio_out` (scriptCHOP) | **pitch + chakra core** (`audio_out_callbacks`): LINEAR `spectrum` → TRUE fundamental `peakHz` (harmonic-product-spectrum) + `energy`; `hue`/`chakra` = nearest Solfeggio (396–963 Hz) for colour. Input OPTIONAL (no input = safe defaults) |
| `cymatics` (glslTOP) + `cymatics_pixel` | **Chladni square-plate figure** (Ritz superposition); `chladniMorph` crossfades continuously between integer `(n,m)` figures driven by bowl pitch |
| `chladni_mode_src → chladni_mode_lag` | float `(n,m)` source: log-pitch map, idle drift via `chladni_silence`/`chladni_silence_lag` (idle only after ~6 s silence) |
| `chladni_height` / `chladni_thr` / `chladni_nrm`, `chladni_sand` (+`_pixel`/`_fb`) | nodal-line velocity field for the flow + the discrete sand-grain layer |
| `flow` (glslTOP) + `flow_pixel` / `flow_fb` | **the visible aura**: liquid-ink feedback. Finger velocity (`uFing0..9`) stirs it; bowl pitch (`uPitch` via `pitch_src`/`pitch_lag`) sets swirl fineness/speed; time from integrated phase `flow_rate`→`flow_phase` (stutter-free) |
| `aurora` (glslTOP) | 4 undulating BPM-tinted light ribbons (reads `peakHz`) |
| `comp_*` chain → `master_level → master_out` | camera *over* void → flow → sand → (bloom/aura/tips layers **bypassed**) → color correct → final null (preview / projector). `master_out` = 1280×720 |
| `heartbeat` (lfoCHOP) | pulse rate from live Arduino BPM; `amp = 1.0` on a live sensor / `0.55` gentle sim otherwise (always breathes). See heartbeat-serial doc |
| `pulse_serial → pulse_callbacks → bpm_raw → bpm_smooth` | live BPM chain feeding `heartbeat.frequency` (serial OFF in the saved file) |
| `aura_warp`, `orbs`, `p_*` particles | **DORMANT** — built, not composited; kept for reference/revert |

The shader uniforms on `cymatics` / `chladni_*` / `flow` / `aurora` are expressions reading
`pose`, `hands_lag`/`hands_vel`, `audio_out`, and `heartbeat`, so the whole stage reacts to
sound + pitch + pulse + hands with no extra wiring. **The mic + `spectrum` are NOT saved**
(added on demand by `enable_bowl_audio.py`, which forces the linear spectrum mode).

## Pose source: standalone (the demo) vs. browser bridge (retired)

Two ways to drive the `pose` channels that the particles + aura read:

1. **Standalone, TD-native (the demo path).** TD does its own MediaPipe pose tracking:
   `td/mp_engine.py` (PoseLandmarker, LIVE_STREAM async) + the `pose_mp` scriptCHOP
   (`td/pose_mp_callbacks.py`) reading TD's own `camera_in`. Models bundled in
   `td/models/` (offline). No browser, no WebSocket, no camera contention. Recreate the
   Python runtime once per clone: `pip install -r td/requirements.txt --target td/pylibs`.

   **DONE (2026-05-29):** `pose_mp` (and `hands_mp`) are placed + wired in `cbl.toe`; the
   public `pose` read point is repointed to `pose_mp` (the `pose_ws` chain is kept but
   disconnected for easy revert). Verified standalone: head/torso 0.97/0.99, no browser. See
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

## Live heartbeat (Arduino) — DONE

The pulse chain is built and live-verified: `pulse_serial` (serialDAT @115200, **OFF** in the
saved file) → `pulse_callbacks` (parses BPM) → `bpm_raw` → `bpm_smooth` → `heartbeat.frequency`.
`heartbeat` stays an LFO; its `amp` expression gives a full pulse on a live sensor and a gentle
breathe (0.55) without one. Enable on the demo laptop with `td/enable_pulse_serial.py` (COM7;
needs both `dtr`+`rts`). Full writeup: `docs/touchdesigner-heartbeat-serial-2026-06-09.md`.

## Gotchas (learned the hard way)

- **Do NOT save with a live `audiodeviceinCHOP` in the network on a machine
  whose audio driver is flaky.** TD enumerates audio devices during
  `project.save()` and can HANG (UI stays responsive, but the HTTP/MCP server
  freezes). Call `disable_bowl_audio()` before saving on such a machine.
- **Saving via MCP works** with an absolute path: `project.save(project.folder + '/cbl.toe')`
  overwrites cleanly (verified 2026-06-16, mic/serial disabled first). `cbl.*.toe` are TD's
  auto-increment backups and are git-ignored. (Disable the bowl mic + serial before saving — see
  the audio-device hang gotcha above.)
