# TouchDesigner Hand-Particle Feature — Handoff
_Session date: 2026-05-26 · Last updated: 2026-05-28_

---

## ✅ FEATURE SHIPPED — 2026-05-28

The hand-particle feature is **complete, promoted to `td/cbl.toe`, and smoke-tested
end-to-end with synthetic pose data**. Commits: `2109600` (promote WIP → cbl.toe) and
`5e09fe6` (uniform fixes + enable timeline play).

Open `td/cbl.toe` to see the working build. The earlier "particles stack at center"
bug was fixed in the 2026-05-27 session via the SOP-instancing path
(`p_ctsop` choptoSOP + `p_geo.par.instancing=True`). Three further latent bugs found
and fixed on 2026-05-28 via a synthetic-pose smoke test:

- `uTorso.x` was unbound on `p_sim` — biased the particle home off-center. Bound to
  `op('pose')['torso_u']-0.5`.
- `uSpeed.{x,y,z,w}` were ALL unbound on `p_sim` — scatter-from-fast-hands and
  audio-energy chaos noise were dead. Bound to wrist speeds, audio energy, heartbeat.
- `root.time.play = False` — the feedback shader could not iterate. Now True so the
  file plays on open.

Smoke-test result: synthetic hands at u=0.30 (L) and u=0.70 (R) with confidence 1.0
produced **1031 particles toward L hand** (x<-0.15), **1006 toward R hand** (x>+0.15),
**0 at center**, x range -0.24 to +0.24 — exactly the shader's intended behavior.

The detailed running log of this work and the still-pending live-with-a-person test
lives in **`docs/touchdesigner-resume-2026-05-27.md`**.

---

## ORIGINAL FINAL STATUS (2026-05-26 — superseded by section above; left for historical context)

**Where we stopped:** The web→TD pose pipe is DONE and verified. The GPU particle
system is ~90% built and the **physics simulation is proven correct** — particles
gather to the hands exactly as designed. One render-mapping bug remains: the
per-instance translate from the CHOP is **not being applied**, so all 2048
instances render stacked at screen-center instead of at their simulated
positions. That is the single thing to fix on resume. Aura (`aura_warp`),
composite, and save are NOT done.

**TD work IS saved** to a NEW file: **`td/cbl_hands_wip.toe`** (19.7 KB) — it
contains the pose bridge (§3) AND all particle ops (built list below). The
original `td/cbl.toe` was left untouched (known-good, no particle ops). **To
resume, launch `cbl_hands_wip.toe`, not `cbl.toe`.** Web-app changes are saved
normally (`src/net/usePoseStream.ts`, `src/App.tsx`). When the feature is
finished and verified, promote the WIP file back to `cbl.toe` (disable any live
audio op first, then delete `cbl.toe` and save over it — see §5 Step 4).

### Particle ops actually built this session (network `/project1/cbl`)
| Op | Type | Notes |
|---|---|---|
| `p_init` | glslTOP (rgba32float, **2048×1**) | seeds home disc around origin; RG=pos, BA=vel |
| `p_fb` | feedbackTOP | `par.top='p_null'`, format rgba32float |
| `p_sim` | glslTOP (rgba32float, **2048×1**) | force integrator; reads `p_fb`; uniforms bound to `pose`/`audio_out`/`heartbeat` (verified compiling, gathers to hands) |
| `p_null` | nullTOP | feedback output / read point |
| `p_chop` | toptoCHOP | `top=p_null`, **`crop='row'`, `downloadtype='immediate'`** → channels r,g,b,a × 2048 samples (this combo was the fix; `crop='full'` wrongly makes r0,g0,… per-pixel channels) |
| `p_sprite` | glslTOP (128×128) | soft radial glow sprite for the quad colormap |
| `p_quad` → `p_qnull` | rectangleSOP→nullSOP | 0.024 quad, orient `xy`, texture on |
| `p_geo` | geometryCOMP | `instanceactive=1`, `instanceop='p_chop'`, `instancetx='r'`, `instancety='g'`, `instancecountmode='manual'`, `numinstances=2048`, `material='p_mat'` |
| `p_mat` | constantMAT | additive (`blending=1`, `srcblend='one'`, `destblend='one'`, depth off), `colormap='p_sprite'`, color tinted by chakra hue via `colorsys` expr |
| `p_cam` | cameraCOMP | `projection='ortho'` (NB menu value is `ortho`, not `orthographic`), `orthowidth=1`, `tz=2` |
| `p_render` | renderTOP | camera `p_cam`, geometry `p_geo`, 1280×720, `bgcolora=0` |

### THE BUG TO FIX FIRST (instance translate not applied)
Verified facts: `p_sim` positions span X≈[-0.23,0.23], Y≈0.045 (correctly gathered
to two still hands at u=0.30/0.70). `p_chop` has channels **r,g,b,a with 2048
samples** and correct values (`r[0]≈-0.207`). Material/camera/render WORK (a bright
quad renders at center). Yet `p_render` shows max brightness only at center
(640,360), nothing at the expected hand pixels (~384,302 and ~896,302). So
`p_geo` is ignoring `instancetx`/`instancety` and drawing every instance at origin.

Likely causes to check, in order:
1. Confirm the quad actually made it into `p_geo`'s In SOP (CreateGeometryComp
   `input_op=p_qnull`). If the In SOP is empty, only a default renders. Open
   `p_geo` and check the internal `in1`/geo content.
2. Verify instancing is truly reading translate: in newer TD the relevant toggle
   is `instanceactive` (set) — but also check there isn't a separate per-channel
   enable, and that `instancetx`/`instancety` accept bare channel names `r`/`g`
   (they were set and read back as `r`/`g`).
3. Try `instanceop` pointing at the **CHOP** with `instancecountmode='oplength'`
   AND confirm oplength counts SAMPLES (2048), not channels (4). If it counts
   channels, that explains "1-ish instance at origin"; use `manual`+`numinstances=2048` (already set) and re-cook `p_geo`.
4. As a known-good alternative, instance from a **SOP**: `choptoSOP` (or
   `toptoSOP`) to make 2048 points carrying P, then `instanceop`=that SOP with
   `instancetx='P(0)'`, `instancety='P(1)'` (TD's most reliable instancing path).
5. Sanity-check scale: positions are in centered world units [-0.5,0.5]; cam
   orthowidth=1 shows exactly that. A particle at X=0.2 must land at screen
   x=(0.2+0.5)*1280=896. If translate were applied it would be visible there.

Once a cluster appears at the hand pixels, the headline feature works → then do
`aura_warp` (§5 Step 2), composite (Step 3), and save (Step 4).

### Coordinate note (matches what was built)
`pose_ws_cb` already flips Y (`v = 1 - y`). The particle uniforms map to centered
world space as `x = u - 0.5`, `y = (v - 0.5) * 0.5625` (these exact expressions
are set on `p_sim` vec0/vec1/vec2). Use the same for `aura_warp`.

---

## 1. Summary

The goal is to make the person's wrists (from MediaPipe pose) act as force fields on a GPU particle system inside TouchDesigner, and to warp a glowing body aura around the hands: hands held still gather/attract particles; fast-moving hands push them away. The web app (React/Vite) already tracks wrists via MediaPipe; the chosen approach streams those coordinates to TD over a local WebSocket (`ws://localhost:9980`), with TD doing all GPU work and outputting to the projector via `master_out`. This session built the full web→TD data pipe (web hook + TD ingestion) and leaves the GPU particle sim, aura shader, and composite as the remaining work.

---

## 2. Status at a Glance

### Done
- [x] `src/net/usePoseStream.ts` — browser WS client, 25 Hz JSON frames, gate flag, auto-reconnect
- [x] Wired into `src/App.tsx` (`usePoseStream(tracking.anchors)`)
- [x] `pose_ws` webserverDAT in TD (port 9980, server mode)
- [x] `pose_ws_cb` textDAT — parses JSON, flips Y to TD UV, stores dict on component store
- [x] `pose_raw` scriptCHOP — reads dict, EMA smooths positions, computes per-hand SPEED (uv/sec)
- [x] `pose` nullCHOP — public output with named channels (see §3)
- [x] `tsc` passes, `vitest` 15/15 pass

### In Progress / Not Started
- [ ] `bloom_particles` — GPU GLSL feedback particle sim
- [ ] `aura_warp` — hand-warped body aura glslTOP
- [ ] Composite: insert both layers before `master_level`
- [ ] Save `cbl.toe` safely (audio-disable + delete-then-save)
- [ ] End-to-end verification

---

## 3. What Is Done in Detail

### Web App — `src/net/usePoseStream.ts`

New hook (246 lines). Uses a `latest-ref` pattern so the send-interval timer always reads current anchors without re-triggering the socket effect.

**Behavior:**
- Opens `WebSocket` to `ws://localhost:9980` (or `VITE_TD_WS_URL`).
- Sends a JSON frame every 40 ms (~25 Hz) when socket is `OPEN`.
- Reconnects every 2 s on close/error.
- **Gated off by default.** Enable via:
  - Build env: `VITE_TD_BRIDGE=1` (set in `.env.local` or command line)
  - Runtime: `localStorage['td-bridge'] = '1'` in the browser console (persists across reloads)

**Frame schema:**
```json
{
  "t": 123456,
  "head":      [x, y, conf],
  "lShoulder": [x, y, conf],
  "rShoulder": [x, y, conf],
  "lWrist":    [x, y, conf],
  "rWrist":    [x, y, conf],
  "torso":     [x, y, conf]
}
```
All coords are already-mirrored, normalized 0..1 (origin top-left, matching the canvas). Values are null when the landmark is not visible.

**Wired in `src/App.tsx`:** called as `usePoseStream(tracking.anchors)` immediately after `usePoseTracking(...)`.

---

### TD Pose Bridge — `/project1/cbl`

Four operators built and verified (no errors, channels populated when browser connects):

| Operator | Type | Purpose |
|---|---|---|
| `pose_ws` | webserverDAT | WS server, port 9980, active=1; `callbacks = pose_ws_cb` |
| `pose_ws_cb` | textDAT | `onWebSocketReceiveText`: parse JSON, flip `v = 1 - y`, store parsed dict on `op('/project1/cbl').store('pose_msg', ...)` |
| `pose_raw` | scriptCHOP | Reads `pose_msg` each cook; EMA-smooths u/v (~60ms); computes SPEED = `sqrt(du² + dv²) / dt` per hand |
| `pose` | nullCHOP | Public output — downstream ops read from here |

**Channels on `pose` nullCHOP:**
```
lWrist_u    lWrist_v    lWrist_c    lWrist_spd
rWrist_u    rWrist_v    rWrist_c    rWrist_spd
head_u      head_v      head_c
torso_u     torso_v     torso_c
lShoulder_u lShoulder_v lShoulder_c
rShoulder_u rShoulder_v rShoulder_c
```
All position channels are normalized 0..1 UV space (v is y-up). `_spd` is in uv/sec.

---

## 4. Coordinate Convention

**Work in UV space throughout.** The Y-flip is already done in `pose_ws_cb` (`v = 1 - y`), so downstream GLSL should not flip again.

For the GPU particle sim and aura, map to **centered world space** for an orthographic camera at 1280×720 (16:9):

```glsl
float worldX = u - 0.5;
float worldY = (v - 0.5) * 0.5625;   // 0.5625 = 720 / 1280
```

Hand/torso uniforms for the force sim and aura shader must use this same transform so forces align with the on-screen body. The TD camera is selfie-mirrored just like the web canvas, so anchor `u` maps directly to screen `u` — no additional horizontal flip needed.

---

## 5. Remaining Work (ordered)

### Step 1 — GPU Particle Sim (`bloom_particles`)

**Pattern:** GLSL feedback position-sim TOP.

- `p_init` (constantTOP, rgba32float, 64×64): seeds black (particles will be initialized by the shader's first-cook branch).
- `p_fb` (feedbackTOP): `par.top = 'p_null'`; reset-pulse after setup; `par.resetpulse.pulse()`.
- `p_sim` (glslTOP, rgba32float, 64×64): reads `p_fb` as input; integrates forces each frame. Channels: R=u, G=v, B=vel_u, A=vel_v.
- `p_null` (nullTOP): closes the feedback loop; `p_fb.par.top` points here.

**Force model (GLSL fragment, abbreviated):**

```glsl
// home spring — pulls toward torso
vec2 home = vec2(uTorso.x - 0.5, (uTorso.y - 0.5) * 0.5625);
vec2 toHome = home - pos;
vel += toHome * uSpring * dt;

// per hand: gather or push
for each hand h in {uLHand, uRHand}, speed s in {uLSpeed, uRSpeed}:
  vec2 toHand = h - pos;
  float dist = length(toHand) + 0.001;
  float gate = smoothstep(0.05, 0.2, s);          // 0=still → gather, 1=fast → push
  float gather = (1.0 - gate) / (dist * dist);    // attract ~1/r²
  float push   = gate * s * exp(-dist * 8.0);     // repel ~speed * e^(-dist)
  vel += normalize(toHand) * (gather - push) * dt;

// light noise (curl or per-particle offset)
vel += noise(pos * 10.0 + uTime) * 0.002;

// damping
vel *= 0.97;
pos += vel * dt;
```

**Uniforms** (set via param expressions reading `pose` CHOP):

| Uniform | Expression |
|---|---|
| `uLHand` vec2 | `op('pose')['lWrist_u']`, `op('pose')['lWrist_v']` |
| `uRHand` vec2 | `op('pose')['rWrist_u']`, `op('pose')['rWrist_v']` |
| `uLSpeed` float | `op('pose')['lWrist_spd']` |
| `uRSpeed` float | `op('pose')['rWrist_spd']` |
| `uTorso` vec2 | `op('pose')['torso_u']`, `op('pose')['torso_v']` |
| `uEnergy` float | `op('audio_out')['energy']` |
| `uHue` float | `op('audio_out')['hue']` |
| `uBeat` float | `op('heartbeat')['beat']` |
| `uTime` float | `absTime.seconds` |

**Render chain:**
```
p_null → toptoCHOP (p_chop, channels r,g = u,v) →
Geometry COMP (instanceactive=1, instanceop=p_chop, instancetx='r', instancety='g')
  └─ small circle/quad mesh + constantMAT (additive, chakra-tinted)
→ cameraCOMP (orthowidth=1, ortho, 1280×720)
→ renderTOP (1280×720, clear=off for additive)
→ blurTOP (optional soft glow)
→ bloom_out (nullTOP)
```

Use `op.TDAPI.CreateGeometryComp()` for the Geometry COMP. Verify instancing param names with `op.TDAPI.GetParameterList('geometryCOMP')` before setting them.

---

### Step 2 — Hand-Warped Body Aura (`aura_warp`)

A single glslTOP (1280×720, `vertexpixel` mode) drawing a radial soft glow centered on torso, domain-warped near each hand.

**GLSL sketch:**

```glsl
out vec4 fragColor;
void main() {
    vec2 uv = vUV.st;                                   // 0..1, origin bottom-left (TD default)
    vec2 pos = vec2(uv.x - 0.5, (uv.y - 0.5) * 0.5625);

    // domain warp: pull UV toward each hand
    vec2 warpL = warpField(pos, uLHand - vec2(0.5, 0.0), uLSpeed);
    vec2 warpR = warpField(pos, uRHand - vec2(0.5, 0.0), uRSpeed);
    vec2 warped = pos + warpL + warpR;

    // soft torso aura in warped space
    vec2 torsoC = vec2(uTorso.x - 0.5, (uTorso.y - 0.5) * 0.5625);
    float d = length(warped - torsoC);
    float aura = smoothstep(0.35, 0.0, d);

    // BPM/chakra tint (same pattern as cymatics/aurora)
    vec3 color = TDHSVToRGB(vec3(uHue, 0.7, aura));
    color *= 1.0 + uBeat * 0.4;

    fragColor = TDOutputSwizzle(vec4(color, aura * 0.6));
}
```

Uniforms: same set as `p_sim` above (`uLHand`, `uRHand`, `uLSpeed`, `uRSpeed`, `uTorso`, `uHue`, `uBeat`). Follow the `vec0name` / `vec0valuex` expression pattern already used by `cymatics` and `aurora`.

---

### Step 3 — Composite

Insert `bloom_out` and `aura_warp` into the existing chain **before `master_level`**:

```
existing: comp_aur → master_level → master_out
new:      comp_aur → comp_bloom (Composite TOP, add) → comp_aura (Composite TOP, screen) → master_level → master_out
```

- `comp_bloom`: input A = `comp_aur`, input B = `bloom_out`, blend mode = add.
- `comp_aura`: input A = `comp_bloom`, input B = `aura_warp`, blend mode = screen.
- Reconnect `master_level` input from `comp_aur` → `comp_aura`.

---

### Step 4 — Save Safely

1. Check if a live `audiodeviceinCHOP` exists: `op('/project1/cbl/bowl_mic')` (or search). If present, run `disable_bowl_audio()` (paste into Textport or via `td_execute`).
2. Verify project name before save: `td_execute` → `print(project.name)`. It should print `cbl` or `cbl.1` — the file is `cbl.toe` / `cbl.1.toe`.
3. Delete the target file first:
   ```powershell
   Remove-Item "C:\projects\CBL\td\cbl.toe" -Force
   ```
4. Then save via MCP: `td_execute` → `project.save('C:/projects/CBL/td/cbl.toe')`.
5. Verify the file appeared and git-diff shows changes.

---

### Step 5 — End-to-End Verification

1. Launch TD and confirm MCP responds: `td_execute` → `print(project.name)`.
2. Start the web app with bridge enabled:
   ```powershell
   $env:VITE_TD_BRIDGE = '1'; npm run dev
   ```
   (or set `localStorage['td-bridge']='1'` in browser console after `npm run dev`).
3. Open the app at `http://localhost:5173`. Allow camera + mic.
4. In TD `pose_ws` DAT: verify a client row appears. In `pose` CHOP: channels should vary as you move.
5. Hold a hand still → particles should drift/gather toward it.
6. Move a hand fast → particles should scatter/push away.
7. `master_out` (right-click → View) shows the full composite.
8. Run `op.TDAPI.CheckErrors(op('/project1/cbl'), recurse=True)` → no errors.

---

## 6. How to Resume

### Launch TouchDesigner

```powershell
# resume the in-progress particle work (NOT cbl.toe — that lacks the particle ops):
& "C:\Program Files\Derivative\TouchDesigner\bin\TouchDesigner.exe" "C:\projects\CBL\td\cbl_hands_wip.toe"
```

Wait 15–60 s for TD to fully load. Poll for the MCP API:

```powershell
Get-NetTCPConnection -LocalPort 44444 -State Listen
```

Then confirm the API actually responds (not just socket open) by running a `td_execute` `print(project.name)` from Claude Code. A socket-open but wedged TD will time out — if so, kill and relaunch.

### Load the TD skill in Claude Code

```
/touchdesigner:td-guide
```

### Enable the web pose bridge

Option A — env var (persists for that terminal session):
```powershell
$env:VITE_TD_BRIDGE = '1'; npm run dev
```

Option B — runtime (no restart needed):
```js
// In browser devtools console:
localStorage['td-bridge'] = '1'
// Then reload the page.
```

### Verify the pipe is live

In TD: open `pose_ws` DAT → should show 1 connected client. Open `pose` nullCHOP → `lWrist_u/v` channels should change as you move your hands in front of the camera.

### Resume building

Pick up at Step 1 above (`bloom_particles`). Use `op.TDAPI.CreateOp` for all operator creation; verify param names with `op.TDAPI.GetParameterList('typeName')` before setting them; always check errors in a **separate** `td_execute` call after a fix.

---

## 7. Risks & Gotchas

| Risk | Mitigation |
|---|---|
| **Audio hang** | Never save `cbl.toe` with a live `audiodeviceinCHOP`. Call `disable_bowl_audio()` first. If TD wedges (UI responsive, MCP times out), kill the process and relaunch from the saved file. |
| **Save overwrite silently declined** | The non-interactive MCP API auto-declines "overwrite?" — delete the `.toe` file first, then `project.save(...)`. |
| **Stale error after fix** | TD caches errors at the frame boundary. Always check errors in a **second, separate** `td_execute` call, not in the same call as the fix. |
| **Wrong param names** | TD operator parameter names are not obvious (e.g. `instancetx` not `instanceTranslateX`). Always call `op.TDAPI.GetParameterList('typeName')` before setting unfamiliar params. |
| **Wrist out of frame** | MediaPipe pose drops wrist confidence when hands leave the frame. `pose_raw` EMA-smooths positions, but a hand that exits entirely will freeze at its last-known position. Consider adding a confidence gate in the force shader: zero force when `lWrist_c < 0.3`. |
| **TD WS DAT instability** | If `pose_ws` DAT proves unreliable, the fallback is a small Node `ws`→OSC-UDP relay feeding a TD `OSC In CHOP`. Documented in the approved plan but not built. |
| **Laptop-only demo unaffected** | Bridge is gated off by default — the canvas demo runs normally if TD is absent. Do not change the default; only set `VITE_TD_BRIDGE=1` in TD-connected sessions. |
| **Coordinate mismatch** | Y-flip is already done in `pose_ws_cb`. Do NOT flip again in GLSL. Use `worldX = u - 0.5`, `worldY = (v - 0.5) * 0.5625` for centered world space in the particle sim and aura. |
