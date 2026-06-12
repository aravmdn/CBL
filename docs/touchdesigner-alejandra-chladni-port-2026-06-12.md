# Porting Alejandra's Chladni work into `cbl.toe` — RESUME DOC (2026-06-12)

> **STATUS: ✅ BUILT, VERIFIED & SAVED (2026-06-12, after the reboot).** All three
> changes are live in `cbl.toe` (glow §4.1, idle drift §4.2, sand-grain §4.3),
> error-free recursively, saved mic-free (29610→31074 B). The as-built record moved to
> `docs/touchdesigner-chladni-implementation-2026-06-09.md` §10. Alejandra's original file
> is now committed at `td/experiments/alejandra-chladni/`. The plan below is kept as the
> design rationale + extraction reference. Remaining: live aesthetic tuning with the real
> bowl (knobs listed in chladni-implementation §10).

This is the actionable companion to `docs/touchdesigner-chladni-implementation-2026-06-09.md`
(our as-built Chladni) and the analysis the user approved on 2026-06-12.

---

## 0. The ask (what the user approved)

Teammate **Alejandra** delivered an untracked file `EngineeringArt_TouchDesign.10.toe`
(repo root, ~16 KB, saved 2026-06-12). It's a standalone full-screen square-plate Chladni
visualizer — an independent re-implementation of the **same Ritz math** already in our
`cymatics`. The user asked to extract its logic and **port the good bits into `cbl.toe`**.

User selected **all three** upgrades (multi-select, 2026-06-12):
1. **Soft Gaussian glow** (quick win)
2. **Sand-grain accumulation layer** (headline, on-concept)
3. **Idle ambient drift / attract state**

Decision on the grain-vs-flow tension: **layer both** (grain subtle + bowl-gated, ease the
flow-gather slightly), reversible; offer to let grain fully replace the flow-gather (Option B)
if it looks too busy live.

---

## 1. Alejandra's file — full extraction (so we never re-open it)

Decoded via `toeexpand` + her embedded MCP server (port **9980**, routes `/ping` `/execute`
`/op` `/network`). All GLSL TOPs compile error-free; output renders live & animating.

**What renders (the perform output):** `/project1/out1 ← chladni_compute` (glslmultiTOP,
1280², pixeldat=`chladni_shader`), fed by `nm_top` (constant TOP whose R/G carry n/10,m/10).

**`chladni_shader` (her core, SYMMETRIC `+`):**
```glsl
vec2 params = texture(sTD2DInputs[0], vec2(0.5)).rg;
float un = params.r*10.0, um = params.g*10.0;
float x = vUV.s*2.0-1.0, y = vUV.t*2.0-1.0;
float v = cos(un*PI*x)*cos(um*PI*y) + cos(um*PI*x)*cos(un*PI*y);  // PLUS (we use MINUS)
v = abs(v);
float sand = exp(-v*v / 0.004);                                  // Gaussian glow
fragColor = vec4(sand, sand*0.9, sand*0.75, 1.0);                // fixed warm white
```

**`/chladni_driver` (executeDAT, `onFrameStart`):** two slow sine oscillators blended with
`audio_rms` (×40, clamp 1), smoothed `alpha=0.03`, writes `(n/10, m/10)` into `nm_top` color,
force-cooks. → **continuous float morph** between figures (we quantise to integers instead).
Always alive even with no bowl (oscillators run). `chop_exec1` is an older beat→random-int
driver, superseded.

**`sand_pixel` (THE novel idea — UNWIRED in her file, renders the missing-input checker):**
```glsl
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+19.19); return fract(p.x*p.y); }
// nm from input[1].rg*10 ; feedback from input[0]
float frame = uTD.time.frame;
float s1 = hash21(uv*317.0 + frame*0.41);
float s2 = hash21(uv*317.0 + frame*0.41 + 53.73);
vec2 pos = uv*2.0-1.0;
pos.x += (s1-0.5)*0.025;  pos.y += (s2-0.5)*0.025;        // grain jitter
float v = cos(n*PI*pos.x)*cos(m*PI*pos.y) + cos(m*PI*pos.x)*cos(n*PI*pos.y);
float grain = smoothstep(0.06, 0.0, abs(v));             // visible only near nodal line
grain *= step(0.45, s1);                                  // ~55% speckle per frame
vec4 prev = texture(sTD2DInputs[0], uv);
float acc = min(prev.r*0.94 + grain*0.28, 1.0);          // FEEDBACK accumulation
fragColor = vec4(acc, acc*0.93, acc*0.78, 1.0);          // warm sand
```
This is the discrete-grain answer to the same goal as our Option-B flow-gather: matter piling
on the nodal lines. Granular, textured, builds over time — the thing our clean glow lacks.

**Dead-ends (ignore):** `glsl1` (particle-advection position buffer, never rendered to points),
`chladni_field`/`chladni_pixel` (near-blank alt), `geo1`(torus)/`light1`/`camera1`/`render1`
(default new-project boilerplate). She also embedded the claude-touchdesigner MCP (on 9980).

**Verdict:** skip her symmetric `+` (breaks our antisymmetric-Ritz report story) and her
continuous non-integer morph (less physically honest than our integer stepping). Take the
**Gaussian glow**, the **grain accumulation**, and an **idle-alive** behaviour.

---

## 2. Our current `cbl.toe` state (`/project1/cbl`) — exact, no re-expand needed

**`cymatics_pixel` (ANTISYMMETRIC `−`, the visible figure):**
```glsl
// uniforms: uTime(float), uAudio(vec3 x=energy y=peakHz z=beat^3), uHue(float), uMode(vec4 n,m,breathScale,phase)
float chladni(vec2 p,float n,float m){ return cos(n*PI*p.x)*cos(m*PI*p.y) - cos(m*PI*p.x)*cos(n*PI*p.y); }
// main(): aspect-correct uv to keep plate square; energy=clamp(uAudio.x,0,1.5); pulse=uAudio.z;
//   n=max(1,uMode.x); m=max(1,uMode.y); scale=max(0.2,uMode.z);
//   warp = vec2(sin(uv.y*1.4+uTime*0.20), cos(uv.x*1.4-uTime*0.17))*0.05;
//   p = uv*0.5+0.5; p=(p-0.5)*scale+0.5+warp;
//   float f = chladni(p,n,m);
   float nodes = 1.0 - smoothstep(0.0, 0.05, abs(f));   // <-- CHANGE THIS LINE (§4.1)
//   float fill = 0.5+0.5*f; float field = mix(fill,nodes,0.78);
//   float vig = smoothstep(1.95,0.15,length(uv));
//   float bright = (0.13 + energy*1.0 + pulse*0.35)*vig*(0.32+0.68*field);   // <-- base 0.13 (§4.2)
//   float hue = fract(uHue + nodes*0.06 + 0.02*sin(uTime*0.10));
//   col = TDHSVToRGB(vec3(hue,0.70,clamp(bright,0,1))); fragColor=TDOutputSwizzle(vec4(col,clamp(bright,0,1)));
```

**`uMode` expressions on the `cymatics` glslTOP** (TD parameter expressions, `.par.vecNvalueX.expr`):
| uMode | par | current expression |
|---|---|---|
| n | `vec3valuex` | `max(2, min(9, round(2 + (op('audio_out')['peakHz']-300)/120)))` |
| m | `vec3valuey` | `max(3, min(12, round(2 + (op('audio_out')['peakHz']-300)/120) + 3))` |
| breathScale | `vec3valuez` | `0.95 + 0.12*max(0.0, op('heartbeat')['beat']) + 0.03*math.sin(absTime.seconds*0.15)` |
| phase | `vec3valuew` | `absTime.seconds` |

**`chladni_height_pixel`** (Option B velocity source): grayscale `h=clamp(abs(f)*1.4,0,1)`, SAME
`chladni()`/uMode/aspect/warp as cymatics → `chladni_thr` (Threshold) → `chladni_nrm` (Normal TOP)
→ feeds `flow` input[2].

**`flow_pixel`** (Option B advection): `uChladni.x = g` gain;
`puv = uv - (fl*warp*(1.0 - min(0.85, g*4.0)) + cv*g*1.6)` where `cv` = velocity toward nodal
lines from input[2]. Gain expr on `flow.vec1valuex`: `min(0.18, max(0.0, op('audio_out')['energy'])*0.25)`.
→ **ease this** in §4.3 so grain+flow don't double-emphasize.

**Composite:** void → camera → +flow(cymatics+aurora+orbs feedback) → +aura → +fingertip orbs →
`master_out`. Discrete `p_sim`/`p_render` particles are DORMANT (not composited).
Per-frame force-cook handled by `cook_driver` executeDAT (finger-orbs fix).

---

## 3. Why this fits cleanly

The hard plumbing — bowl `peakHz`→integer `(n,m)`, heartbeat→`breathScale`, chakra→`uHue` —
**already exists as the shared `uMode`/`uAudio`/`uHue` uniforms**. Alejandra's techniques bolt
straight onto that. Her file is full-screen standalone; ours composites cymatics into the FLOW
layer around a live person — so we port *techniques* into our layer, we don't drop her file in.

---

## 4. The three changes (execute via MCP, port 44444, context op `/project1/cbl`)

### 4.1 Soft Gaussian glow (cymatics_pixel) — quick, reversible
Read `op('/project1/cbl/cymatics_pixel').text`, replace the one line:
```glsl
float nodes = 1.0 - smoothstep(0.0, 0.05, abs(f));
```
with
```glsl
float nodes = exp(-f*f / 0.005);   // soft luminous glow (Alejandra's exp falloff); tune 0.004–0.006
```
Write it back. A/B screenshot. (σ²=0.005 ≈ same line thickness as the old smoothstep(0,0.05).)

### 4.2 Idle ambient drift / attract state — keep physics-honest when bowl active
Goal: with no bowl, the figure should slowly cycle valid INTEGER figures and be faintly visible
(attract state), but snap to `peakHz` when the bowl plays. Two parts:
- **Idle figure cycling** — make n/m fall back to a slow timed integer when energy is low. Replace
  the n/m expressions on `cymatics` (and identically on `chladni_height` so they stay aligned):
  - n (`vec3valuex`):
    ```python
    (max(2,min(9,round(2+(op('audio_out')['peakHz']-300)/120)))) if op('audio_out')['energy']>0.02 else (3 + int(absTime.seconds/6.0)%5)
    ```
  - m (`vec3valuey`):
    ```python
    (max(3,min(12,round(2+(op('audio_out')['peakHz']-300)/120)+3))) if op('audio_out')['energy']>0.02 else (3 + int(absTime.seconds/6.0)%5 + 3)
    ```
  (n≠m preserved by the `+3`. The idle set cycles n∈{3..7}, m=n+3, every 6 s.)
- **Idle base glow** — in `cymatics_pixel`, the `0.13` base is intentionally low (bowl-gated). For
  an attract glow, bump only when idle, e.g. change `bright` base to:
  `(0.13 + 0.10*(1.0 - clamp(energy*30.0,0.0,1.0)) + energy*1.0 + pulse*0.35)` (≈0.23 when silent,
  →0.13 as the bowl comes in). Tune live; keep subtle so a real strike still clearly brightens.

> NEEDS LIVE AESTHETIC JUDGMENT. Build it, then tune the 0.02 threshold / 6 s period / 0.10 idle
> glow with the user watching.

### 4.3 Sand-grain accumulation layer — the headline (most work)
New operators under `/project1/cbl`, reusing the SHARED uMode & our `−` chladni (NOT her `+`):
1. **`chladni_sand`** (glslmultiTOP) with a new pixel DAT `chladni_sand_pixel`:
   - Uniforms: copy cymatics' `uTime/uMode` (vec0=uTime, vec3=uMode) AND add `uGain` (vec, bowl
     energy gate). Match aspect/scale/warp to cymatics EXACTLY so grains land on the visible lines.
   - Inputs: `[0] = chladni_sand_fb` (feedback). Shader (adapted from her `sand_pixel`, our `−`):
     ```glsl
     float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+19.19); return fract(p.x*p.y); }
     // aspect-correct uv & build p exactly like cymatics (incl. *scale and +warp)
     float frame = uTime*60.0;                       // or pass uTD.time.frame
     float s1 = hash21(uv*317.0 + frame*0.41);
     vec2 pos = p;  pos += (vec2(s1, hash21(uv*317.0+frame*0.41+53.73))-0.5)*0.025;
     float f = chladni(pos, n, m);
     float grain = smoothstep(0.06,0.0,abs(f)) * step(0.45,s1) * clamp(uGain,0.0,1.0);  // gated
     float prev = texture(sTD2DInputs[0], uv).r;
     float acc = min(prev*0.94 + grain*0.28, 1.0);   // accumulation; *0.94 = slow fade/relax
     fragColor = vec4(vec3(acc), acc);               // grayscale mask; colourise at composite
     ```
2. **`chladni_sand_fb`** (feedbackTOP) → Target TOP = `chladni_sand` (mirror the flow/flow_fb pair).
3. **Composite**: add `chladni_sand` into the output as warm/chakra-tinted sand, ADDITIVE, subtle.
   Tint by `uHue` (or warm white `(1,0.93,0.78)`), multiply by a small factor (~0.5) so it reads as
   texture not a wash. Easiest: inject into the flow `src` alongside cymatics, OR a dedicated
   add→over before orbs in the composite. Match resolution to the flow layer.
4. **Gate**: `uGain` bound to smoothed bowl energy (reuse `min(0.18,max(0,energy)*0.25)` *but scaled
   to 0..1*, e.g. `clamp(op('audio_out')['energy']*5.0,0,1)`); grains build on a strike, relax (×0.94) when quiet.
5. **Ease the flow-gather** so they don't double-emphasize: on `flow.vec1valuex` reduce `*0.25`→`*0.18`,
   or in `flow_pixel` `cv*g*1.6`→`cv*g*1.1`. Tune live. (If too busy: set flow gain to 0 and let grain
   fully own the nodal lines — the "grain replaces Option B" fallback.)

---

## 5. Verify + save (MCP gotchas — from memory/touchdesigner_setup)

- Error check: `op('/project1/cbl').errors(recurse=True)` → must be empty.
- A/B without a bowl: temporarily force a signal, e.g. set `op('cymatics').par.vec1valuey` (peakHz)
  to ~963 and the grain `uGain`/flow gain high, screenshot `op('/project1/cbl/<TOP>').save('C:/projects/CBL/_cbl_inspect/x.png')`, then Read it. Reset after.
- **SAVE (deferred, never synchronous):**
  `op('/project1/TouchDesignerAPI')...` context → `run("project.save('C:/projects/CBL/td/cbl.toe')", delayFrames=3)`
  then **confirm by polling file mtime/size on disk** (MCP reply ≠ proof). `project.name` may be
  `cbl.1.toe` (opened increment) — save explicitly to the canonical `C:/projects/CBL/td/cbl.toe`.
- **NEVER enable the bowl mic before saving** (audio-device save-hang). Saved `cbl.toe` stays mic-free.
- `cbl.*.toe` increment backups are git-ignored.

---

## 6. The blocker (why we stopped 2026-06-12)

`cbl.toe` **boot-hangs on this machine**: launched twice, both wedged identically —
`MainWindowHandle=0`, RAM frozen ~496 MB, CPU flat, **port 44444 never opens**, MCP unreachable.
This is the documented boot-hang (memory/touchdesigner_setup §"TD boot hang = reboot"); fix is a
**machine reboot** (GPU/window init stuck — not a `.toe` problem). Note: Alejandra's `ale.toe`
booted fine in the same session (it has no webcam/MediaPipe), so the global GPU state was OK and
the hang is `cbl.toe`-specific (camera + 2× MediaPipe init) or a transient GPU-init wedge a reboot
clears. **The offline `toeexpand`→edit→`toecollapse` route was rejected**: expanded `.text` headers
encode a content-length field (`00 00 0b bf`=3007 for the 3034-byte cymatics_pixel; 27-byte header),
so hand-edits would likely yield an unopenable `.toe` — too risky for the demo file.

### RESUME PROCEDURE (after the user's reboot)
1. User (or me) launches `cbl.toe`; wait 15–60 s; poll `44444` listening.
2. **Confirm with an MCP `td_execute`** `print(project.name)` — a listening socket alone is not
   proof (a wedged TD holds the socket open but never replies).
3. If it hangs again at handle=0/no-port: it's not transient — check the webcam isn't held by
   another app, else ask the user. Do NOT loop relaunches.
4. Once MCP replies: execute §4 in order (1 → 2 → 3), §5 verify+save, §7 commit.

---

## 7. After it's built

- Update `docs/touchdesigner-chladni-implementation-2026-06-09.md` with the glow/grain/idle changes
  (new "2026-06-12 Alejandra port" section), and `CLAUDE.md` "What Is Done".
- Commit + push (memory: always push). Suggested message:
  `feat(td): port Alejandra's Chladni glow + sand-grain + idle attract into cymatics`.
- Decide the fate of the untracked `EngineeringArt_TouchDesign.10.toe`: recommend committing it to
  `td/experiments/alejandra-chladni/` so her work is in git, credited.
- Cleanup temp folders: `C:/projects/CBL/_alejandra_inspect/` and `C:/projects/CBL/_cbl_inspect/`
  (untracked; expansions + PNG captures). Delete once done.

---

## 8. Files touched / created (planned)
| File / op | Change |
|---|---|
| `cbl.toe` → `cymatics_pixel` | glow line → `exp(-f*f/0.005)` (§4.1) |
| `cbl.toe` → `cymatics`, `chladni_height` pars | idle-aware n/m expressions + idle base glow (§4.2) |
| `cbl.toe` → NEW `chladni_sand` (glslmulti) + `chladni_sand_pixel` (DAT) + `chladni_sand_fb` (feedback) | grain layer (§4.3) |
| `cbl.toe` → `flow` gain / `flow_pixel` | ease flow-gather so grain+flow don't double up (§4.3.5) |
| composite | additive warm/chakra-tinted sand inject (§4.3.3) |
