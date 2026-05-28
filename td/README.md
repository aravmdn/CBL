# CBL TouchDesigner Project

`cbl.toe` is the GPU visual installation built for the Creative Bowl Lab demo.
It mirrors the React/Vite app's visual language (deep void + chakra-colored
cymatics + BPM-tinted aurora) and adds a GPU **hand-particle system** plus a
**hand-warped body aura** driven by the live web-app pose stream — all rendered
on the GPU for projector output. The earlier simpler grid version of cbl.toe is
backed up locally as `cbl.toe.bak`.

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

## Enable the hand-particle feature live

Open `td/cbl.toe` in TouchDesigner (timeline plays on open). Then start the web app
with the pose bridge on:

```powershell
$env:VITE_TD_BRIDGE = '1'; npm run dev
```

(or in the browser devtools console: `localStorage['td-bridge']='1'`, then reload).

Open http://localhost:5173, allow camera. The TD `pose_ws` DAT should show 1
connected client, the `pose` CHOP channels should change as you move your hands,
and `master_out` should show the particles gathering/scattering at the wrists.

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
