# CBL TouchDesigner Project

`cbl.toe` is the GPU visual installation built for the Creative Bowl Lab demo.
It mirrors the React/Vite app's visual language (deep void + chakra-colored
cymatics + BPM-tinted aurora) but renders on the GPU for projector output.

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
| `comp_cam / comp_cym / comp_aur` | composite: camera *over* void, cymatics + aurora *added* |
| `master_level → master_out` | color correct + final null (preview / projector feed) |
| `audio_out` (scriptCHOP) | **chakra core**: bowl spectrum → nearest Solfeggio (396–963 Hz) → `peakHz / hue / energy / chakra`. Input is OPTIONAL — no input = safe defaults |
| `heartbeat` (lfoCHOP) | 1.17 Hz (~70 BPM) sim pulse; drives the beat scaling until the Arduino arrives |

The shader uniforms on `cymatics`/`aurora` are expressions reading `audio_out`
and `heartbeat`, so the whole stage reacts to sound + pulse with no extra wiring.

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
