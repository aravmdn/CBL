# TouchDesigner Integration Plan — CBL Installation
_Last updated: 2026-05-28_

## Build Status (2026-05-28)

The full reactive GPU visual network is built and saved at **`td/cbl.toe`** — see
`td/README.md` for the operator map. Launch it directly (it embeds the
`TouchDesignerAPI` component on port 44444); no manual TOX drag needed. The earlier
simpler grid version of cbl.toe is kept locally as `td/cbl.toe.bak`.

Done in TD:
- **camera_base** (COMP 3): webcam → mirror → darken (`camera_in → camera_flip → camera_level → camera_out`).
- **cymatics_shader** (COMP 4): glslTOP `sin(kx)·sin(ky)`, chakra-colored, aspect-correct.
- **aurora_curtain** (COMP 5): glslTOP, 4 BPM-tinted ribbons.
- **pose bridge** (replaces OSC plan): web app streams wrists/head/torso to TD over
  WS:9980 via `pose_ws` webserverDAT → `pose_ws_cb` → `pose_raw` scriptCHOP → `pose`
  nullCHOP. ~25 Hz frames, gated off by default in the web app via `VITE_TD_BRIDGE=1`.
- **body_aura → `aura_warp`** (COMP 6): glslTOP that radially glows around the torso and
  domain-warps toward each hand, BPM/chakra-tinted.
- **bloom_particles → `p_*` ops** (COMP 7): 2048 particles in a GLSL feedback sim
  (`p_init`, `p_fb`, `p_sim`, `p_null`, `p_chop`, `p_ctsop`, `p_geo`, `p_render`,
  `p_mat`, `p_sprite`, `p_quad`, `p_qnull`, `p_cam`). Particles gather to still hands,
  scatter from fast ones. Uses SOP instancing (`p_ctsop` choptoSOP) — TOP/CHOP-only
  instancing was finicky across TD versions, see resume doc §3.
- **master_output** (COMP 8): final chain is
  `comp_aur(add) → comp_bloom(add, +p_render) → comp_aura(screen, +aura_warp) → master_level → master_out`.
- **audio_analysis** (COMP 1) chakra core: `audio_out` scriptCHOP (bowl spectrum →
  nearest Solfeggio 396–963 Hz → `peakHz/hue/energy/chakra`). The **live mic is
  deliberately not saved** in the file (it hangs TD on the dev machine); run
  `td/enable_bowl_audio.py` on the demo laptop to switch on real detection.
- **heartbeat** (COMP 2 stand-in): lfoCHOP at 1.17 Hz until the Arduino arrives.

Not yet built (lower priority / need hardware): `heartbeat_serial` (COMP 2) Arduino
reads. The original OSC bridge plan is **superseded** by the WebSocket pose bridge —
no OSC needed.

Smoke-tested 2026-05-28 with synthetic pose (commit `5e09fe6`): hands at u=0.30 / 0.70
with confidence 1.0 produced 1031 particles toward L hand, 1006 toward R hand, 0 at
center. See `docs/touchdesigner-resume-2026-05-27.md` for the full session log.

## Goal
Run TouchDesigner as the GPU rendering engine for the projector output, with the web app as a monitoring/control panel on the primary screen. All on Arav's single machine.

---

## Architecture

```
Bowl mic ──► TD audio analysis COMP ──► OSC ──► Web app (updates UI)
Arduino ─────► TD serial COMP ────────────────────────────────────────►┐
                                                                        │
Web app (MediaPipe pose) ──► OSC ──► TD body aura COMP                 │
                                                                        ▼
TD cymatics (glslTOP) ─┐                                         Projector
TD aurora (glslTOP) ───┼──► TD master composite ──► Window COMP ──────►
TD bloom (POP) ────────┘    (Composite TOP + Color Correct TOP)
TD camera (Video In TOP)
```

---

## TD Network Build Order

### COMP 1: `audio_analysis` (highest priority — better bowl chakra detection)
- **Audio Device In CHOP** → bowl mic
- **Spectrum CHOP** (16384 pt FFT — far better than 2048 web FFT)
- **Band EQ CHOP** → isolate 7 solfeggio bands: 396, 417, 528, 639, 741, 852, 963 Hz
- **Math CHOP** → normalize 0–1
- **Select CHOP** → dominant chakra channel
- **OSC Out CHOP** → sends to web app on port 7000:
  - `/chakra int` (0–6)
  - `/energy float` (0–1)
  - `/peaks float[8]`

### COMP 2: `heartbeat_serial` (activate when Arduino arrives)
- **Serial CHOP** → Arduino USB, parse PPG frames
- **Math CHOP** → IBI → BPM, HRV jitter
- **Trigger CHOP** → 60ms pulse per beat (matches web app BEAT_FLASH_MS=60)
- **OSC Out CHOP** → `/bpm`, `/pulse`, `/variability` → port 7000
- **Until Arduino**: LFO CHOP at 1.17 Hz (70 BPM) + Noise CHOP for jitter

### COMP 3: `camera_base`
- **Video Device In TOP** → webcam
- **Flip TOP** → mirror for selfie view
- **Level TOP** → darken toward #06060C

### COMP 4: `cymatics_shader` (most visually striking — direct port of MATLAB formula)
- **glslTOP** implementing `sin(k*x) * sin(k*y)` interference
  - `k = frequencyPeak / 80` per active peak, summed over 8 peaks
  - Chakra color uniform from audio_analysis
  - 512×512 resolution
- **Blur TOP** → soft glow
- **Composite TOP** over camera (screen blend)

### COMP 5: `aurora_curtain`
- **Noise CHOP** → 4 channels (one per ribbon, 0.3–0.7 Hz)
- **glslTOP** → 4 sine-undulating vertical ribbons
  - Beat tint: violet #B53DFF at pulse peak
  - BPM→color map: violet (<62), cyan (62–72), amber (72–85), orange (≥85)
- **Feedback TOP** → persistence/decay for trailing glow
- **Composite TOP** over cymatics (screen blend)

### COMP 6: `body_aura`
- **OSC In CHOP** → receive MediaPipe landmarks from web app (port 7001)
  - `/pose/head`, `/pose/lShoulder`, `/pose/rShoulder`, `/pose/lWrist`, `/pose/rWrist`
  - Each: float[3] (x, y, confidence)
- **CHOP to SOP** → 3D points
- **Circle SOP** at each landmark → glowing joint rings
- **Line SOP** → skeleton connections
- **constantMAT** with chakra-colored emissive glow
- **Render TOP** over composite

### COMP 7: `bloom_particles`
- **LFO CHOP** + **Noise CHOP** → base orbit motion
- **Math CHOP** scaled by `liveEnergy` from audio_analysis
- **POP system** inside Geometry COMP: 500–2000 particles
  - Orbit radius driven by energy
  - Color = chakra color uniform
  - Beat pulse scales size
- **Render TOP** → additive blend

### COMP 8: `master_output`
- **Composite TOP** → all layers
- **Color Correct TOP** → projector calibration
- **Window COMP** → full-screen to projector (second display)
- **Null TOP** → monitoring preview in TD editor

---

## OSC Bridge: Web App Changes Needed

### Web app receives from TD (port 7000)
Add an OSC receiver to `src/audio/useMicInput.ts` and `src/audio/useHeartbeat.ts`:
- When TD data arrives, it overrides browser FFT/simulated BPM
- `src/App.tsx`: add source toggle "TD / Browser" in control rail

### Web app sends to TD (port 7001)
Add OSC send to `src/camera/usePoseTracking.ts`:
- Fire on every MediaPipe frame with landmark positions

---

## TouchDesigner MCP Setup (REQUIRED BEFORE BUILDING)

**The main window issue**: When launched programmatically (Start-Process, ShellExecute, etc.), TD's main GUI window never appears — only the console window opens. The GPU DLLs load correctly but the Qt/UI layer doesn't initialize.

**Fix**: Open TouchDesigner **manually** by double-clicking it from the desktop or Start menu. Do NOT launch via terminal.

**Steps to enable Claude Code ↔ TD connection:**
1. Open TouchDesigner manually (double-click from Start or desktop shortcut)
2. Drag this file into the TD network editor:
   ```
   C:\Users\20243223\.claude\plugins\cache\claude-touchdesigner\touchdesigner\0.1.6\toe\TouchDesignerAPI.tox
   ```
3. Select the `TouchDesignerAPI` component → set **Port = 44444**
4. Verify: `$env:TDAPI_PORT` should print `44444` in terminal
5. In Claude Code, run `/touchdesigner:td-guide` to load the skill
6. Test connection: Claude will try `td_pane` and `td_operators` — should succeed

---

## Key Code Patterns (from reference files)

```python
# Create operators — ALWAYS use TDAPI wrapper
new_op = op.TDAPI.CreateOp(base, audiodevineIn, 'bowl_mic', x=0, y=0)

# Chain same-family operators (auto-layouts at 200px spacing)
chain = op.TDAPI.ChainOperators([audioIn, spectrum, bandEQ, math, select])

# Verify param names before setting
params = op.TDAPI.GetParameterList('audiodevineIn')

# Fix errors in separate td_execute call (TD caches errors at frame boundary)
# Call 1: fix; Call 2: cook + CheckErrors
```

**glslTOP pattern** (cymatics):
```glsl
out vec4 fragColor;
void main() {
    vec2 uv = vUV.st;
    vec2 res = uTDOutputInfo.res.zw;
    float k = uFrequency / 80.0;
    float pattern = sin(k * uv.x * res.x) * sin(k * uv.y * res.y);
    vec3 color = TDHSVToRGB(vec3(uChakraHue, 0.8, pattern * 0.5 + 0.5));
    fragColor = TDOutputSwizzle(vec4(color, pattern));
}
```

**Feedback TOP** (aurora trails):
```python
feedback = op.TDAPI.CreateOp(base, feedbackTOP, 'feedback')
feedback.par.top = 'null_out'          # relative path to downstream null
const_init = op.TDAPI.CreateOp(base, constantTOP, 'const_init')
const_init.par.colorr = 0              # black initial state
feedback.inputConnectors[0].connect(const_init)
feedback.par.resetpulse.pulse()        # always reset after setup
```

---

## Verification Checklist

1. [ ] TD opened manually, `TouchDesignerAPI.tox` loaded, port = 44444
2. [ ] `td_pane` MCP tool returns network path (confirms HTTP server up)
3. [ ] Build COMP 1 (audio_analysis) → verify chakra index CHOP shifts with bowl pitch
4. [ ] Build COMP 4 (cymatics glslTOP) → verify pattern changes with frequency
5. [ ] OSC bridge → web app UI shows TD-sourced chakra/BPM
6. [ ] Second display connected as projector → COMP 8 Window COMP full-screen
7. [ ] Arduino connected → COMP 2 active, BPM reads from sensor

---

## Resume Prompt for Claude

```
Open the file docs/touchdesigner-integration-plan.md and build the TD network
starting at COMP 1 (audio_analysis). TD should already be running with the
TouchDesignerAPI.tox loaded on port 44444. Use /touchdesigner:td-guide first.
```
