# TouchDesigner — Resume Plan (next session)

_Written 2026-05-27. Start a fresh Claude Code session with this file open._

This is the single entry point to continue the TouchDesigner hand-particle work.
It supersedes nothing — it points at the detailed handoff and tells you exactly
where to start. Full operator-level detail lives in
**`docs/touchdesigner-handoff-2026-05-26.md`** (read it once before building).

---

## ★ DIRECTION + RECOVERY — 2026-05-29 (sixth session)

**TouchDesigner is now the PRIMARY system, run standalone (no browser).** The demo is one
surface (TD) on one webcam. Authoritative architecture written:
`docs/touchdesigner-onesurface-2026-05-27.md`.

What prompted it: a live test (web app + TD together) showed TD with a **frozen image** of
the person (browser `getUserMedia` starved TD's camera) and required the **web tab to stay
open and in focus** (background-tab throttling stalled the pose stream). Both are inherent to
feeding TD from a browser → retire the bridge.

The fix already existed on disk from a prior session but was **never committed or documented**:
- `td/mp_engine.py` — MediaPipe PoseLandmarker (LIVE_STREAM async) inside TD's Python; docstring
  literally says *"the browser pose bridge is retired."*
- `td/pose_mp_callbacks.py` — `pose_mp` scriptCHOP: reads TD's own `camera_in`, runs the engine,
  emits the same channels as the old bridge (`lWrist/rWrist/head/torso _u/_v/_c`, wrists `_spd`).
- `td/models/*.task` (offline) + `td/pylibs/` (vendored runtime).

This session committed the recovered engine + offline models (pylibs git-ignored, recreate via
`td/requirements.txt`) and realigned every doc/memory to TD-primary.

**Open Track B (needs TD on :44444 + a person, browser closed):** place `pose_mp` in
`/project1/cbl`, repoint the public `pose` read point from the `pose_ws` bridge to `pose_mp`,
confirm `camera_in` is a live `videodeviceinTOP`, verify live (camera not frozen; particles/aura
react to real hands), then save mic-free and tune aesthetics.

## ✅ RESOLVED — 2026-05-27 (third session, post-reboot)

The laptop was rebooted; TD booted healthy and the MCP responded. **The headline
feature is now fully built, composited, and saved to `td/cbl_hands_wip.toe`.**

**Root cause of the "particles stack at center" bug:** the geometryCOMP's master
**`instancing` toggle was `False`**. The prior session had set `instanceactive=1`
(a different per-instance-set flag) and tuned `instanceop`/`instancetx`, but the
master `p_geo.par.instancing` switch was never turned on, so the COMP rendered its
template quad exactly once at the origin. Setting `p_geo.par.instancing = True`
(plus the SOP-instancing path below) made all 2048 particles render at the hands.

**What was built this session (all verified, no network errors):**
- `p_ctsop` (choptoSOP): reads `p_chop` via its **`chop` parameter** (choptoSOP has
  no wired CHOP input — that was a second bug in the old `fix_particles()`), with
  `chanscope='r g'`, `attscope='P(0) P(1)'`, `mapping='onetoone'` → 2048 points
  carrying particle XY in P (Z=0). The `p_rename` op is NOT needed and was removed
  (TD sanitizes `P(0)`→`P_0_` in channel names, so the rename trick fails; map
  channels→position via `chanscope`/`attscope` instead).
- `p_geo`: `instancing=True`, `instanceop=p_ctsop`, `instancetx='P(0)'`,
  `instancety='P(1)'`, `instancecountmode='oplength'`. Render sampling confirmed two
  clusters at the hand x-bands (~320–400 and ~840–960), not stacked at center.
- `aura_warp` (glslTOP 1280×720): loads `td/aura_warp.frag`, uniforms `uHands`/
  `uSpeeds`/`uMisc` bound via `vecNname`/`vecNvaluex.expr` reading `pose`,
  `audio_out['hue']`, `heartbeat['beat']`. Compiles clean, outputs a hue-tinted glow.
- Composite: `comp_aur → comp_bloom (add, +p_render) → comp_aura (screen, +aura_warp)
  → master_level`. `master_out` shows particle clusters + aura, no errors.

**Note:** `op.TDAPI.CreateOp` threw `tdError` after creating ops on this build —
raw `parent.create(opType, name)` was used instead and worked fine.

**What's left:**
1. **Live end-to-end test** (needs a person): run the web app with the pose bridge
   on (§5), allow camera, and confirm hands gather/scatter the particles visually.

## ✅ PROMOTED — 2026-05-28 (fourth session)

`cbl_hands_wip.toe` → `cbl.toe` done (live test skipped at user's call). Sequence:
- Verified no live audio input ops in the network (safe to save).
- `op.TDAPI.CheckErrors('/project1/cbl', recurse=True)` → clean.
- Renamed old `cbl.toe` (16546 b) → `cbl.toe.bak`, then `project.save('cbl.toe')`
  returned True. New `cbl.toe` is 21738 bytes. `project.name` is now `cbl.1.toe`.
- WIP file preserved at 21586 bytes.

If the live test later reveals a regression, restore with: `mv td/cbl.toe.bak td/cbl.toe`.

## ✅ SMOKE TEST + UNIFORM FIXES — 2026-05-28 (fifth session)

Drove the pipeline with synthetic pose data (no person needed) to validate the build
end-to-end. Found three more latent bugs the prior sessions had missed; fixed them in
commit `5e09fe6`.

**Bugs uncovered:**
- `uTorso.x` on `p_sim` was unbound. The shader uses `uTorso.x` as the home X position
  for the particle disc; the slider sat at ~0.0563 (leftover), so the particle home
  was offset off-center even when the torso was centered. Bound to
  `op('pose')['torso_u']-0.5`.
- `uSpeed.{x,y,z,w}` on `p_sim` were ALL unbound. The shader reads `uSpeed.x/y` as the
  per-hand speeds (the gate between gather and scatter) and `uSpeed.z` as energy noise
  scaling. With none bound, fast-hand scatter was dead and the audio-energy chaos
  noise was zero. Bound to `pose['lWrist_spd']`, `pose['rWrist_spd']`,
  `audio_out['energy']`, `heartbeat['beat']`.
- `root.time.play = False`. TD's timeline was paused, so the feedback shader (which
  iterates particle positions across frames) never advanced — all 2048 particles
  stayed clamped at their first-frame home position regardless of any uniform changes.
  Set `True` so the file plays on open.

**Smoke-test method:** stored synthetic pose into the COMP storage as
`op('/project1/cbl').store('pose_msg', {...})` and let TD's renderer iterate for ~3s of
wall-clock at 60 fps between two separate `td_execute` calls (sleeping inside a single
`td_execute` blocks the renderer thread). Sampled `p_sim` pixel-by-pixel and counted
the particle x-distribution.

**Result with hands at u=0.30 (L) and u=0.70 (R), confidence 1.0:**
- 1031 particles with x < -0.15 (toward L hand)
- 1006 particles with x > +0.15 (toward R hand)
- 0 particles at center
- x range -0.239 to +0.239 (clean overshoot past the ±0.20 target — physics-correct)
- `master_out` samples show bright magenta/violet peaks at the wrist pixels.

**Outstanding:** still the live end-to-end test with a real person — but the build is
proven correct end-to-end via synthetic data. The unverified piece is now purely
aesthetic feel (gather speed, scatter threshold, glow intensity on a projector).

---

## 0. Why the last session stopped (READ FIRST)

> **Update — 2026-05-27 (second session, after the doc was first written):**
> The boot hang was **reproduced a 4th time** and the wedged TD processes were
> killed (clean slate). TD still requires a **laptop reboot** — that had not been
> done yet. **Ready-to-run resume scripts were prepared offline while TD was
> down** (see below); run them once TD boots healthy post-reboot:
> - `td/aura_warp.frag` — complete aura shader (loaded by the builder).
> - `td/resume_build.py` — `diagnose()`, `fix_particles()`, `build_aura()`,
>   `composite()`. Run one per `td_execute`, checking errors in a separate call.

The work was **not** blocked by anything in the project — it was blocked by
**TouchDesigner failing to boot** on this machine.

Observed 2026-05-27:
- Launching TD (with the WIP file **and** with no file at all) hung
  deterministically at **~348 MB RAM, zero windows, zero CPU**. The MCP port
  44444 never opened. Reproduced 3×.
- Confirmed on screen: **nothing visible** — no window, no dialog, no splash.
- This is a GPU/window-init hang (hybrid graphics: Intel UHD + NVIDIA RTX
  A1000). It built fine the day before, so the environment changed (likely a
  GPU driver / Windows update left the GPU in a bad state).

**Fix: reboot the laptop.** A reboot clears the GPU driver state. This is an
environment issue, not a TD-file issue — do **not** waste time editing `.toe`
files to "fix" the boot hang.

### After reboot — sanity check before anything else
```powershell
# 1. Launch the WIP file (this is the resume target — NOT cbl.toe):
& "C:\Program Files\Derivative\TouchDesigner\bin\TouchDesigner.exe" "C:\projects\CBL\td\cbl_hands_wip.toe"

# 2. Confirm TD actually came up healthy (a window appears, RAM climbs >600MB):
Get-Process TouchDesigner | Select-Object Id,Responding,MainWindowHandle,@{n='RAM_MB';e={[int]($_.WorkingSet64/1MB)}}
#    Healthy = MainWindowHandle is NON-zero and RAM grows well past 348MB.
#    If it sits at ~348MB with MainWindowHandle=0 again, TD still isn't booting —
#    reboot again / check GPU driver. Do not proceed until the window is up.

# 3. Confirm the MCP port is listening:
Get-NetTCPConnection -LocalPort 44444 -State Listen
```
Then in Claude Code: load the skill `/touchdesigner:td-guide`, and **prove the
API replies** (a listening socket alone is not enough — a wedged TD keeps the
socket open but never answers):
```
td_execute: print(project.name)   # should print cbl or cbl.1
```

---

## 1. What your teammates saw ("just a grid, nothing happening")

> **2026-05-28 update:** this section describes the state at the *start* of the
> resume session, when `cbl.toe` was still the simpler grid file and the reactive
> build lived in `cbl_hands_wip.toe`. **Today, `td/cbl.toe` is the reactive build**
> (the original is backed up locally as `cbl.toe.bak`). Teammates opening
> `cbl.toe` now see the hand-particle feature directly. The text below is kept
> for historical context.

They opened **`td/cbl.toe`** — the *basic* visual file. It has camera + a
cymatics **grid** (`sin(kx)·sin(ky)`) + aurora ribbons, and its reactivity reads
from `audio_out`. But `cbl.toe` ships with **no live mic** (deliberate — a live
audio op freezes TD on this machine). No bowl sound → the grid just sits there.
That is expected, not a bug.

The real headline feature — **your hands pulling glowing particles** — lives in
**`td/cbl_hands_wip.toe`**, and it is ~90% built with one render bug left. That
is the file to resume from.

To make `cbl.toe` itself look alive in a quick demo, you can enable the bowl mic
on the demo laptop with `td/enable_bowl_audio.py` (paste into Textport) — but the
priority is finishing the particle feature in the WIP file.

---

## 2. Progress at a glance

| Piece | State |
|---|---|
| Web→TD pose pipe (wrists stream browser→TD over WS :9980) | **DONE & verified** |
| GPU particle physics (gather to still hands, scatter from fast hands) | **DONE & proven correct** (`p_sim` positions span the hands) |
| Particle **rendering** | **DONE** — root cause was `p_geo.par.instancing=False`; fixed via SOP instancing + master toggle on. Clusters render at the hands. |
| Hand-warped body aura (`aura_warp`) | **DONE** — glslTOP built, compiles clean, hue-tinted glow |
| Composite particles + aura into master chain | **DONE** — `comp_bloom`(add)→`comp_aura`(screen)→`master_level` |
| Save WIP (`td/cbl_hands_wip.toe`) | **DONE** — saved 21586 bytes, no errors |
| Promote WIP → `cbl.toe` | **DONE** — 2026-05-28, 21738 bytes; old cbl.toe kept as `cbl.toe.bak` |
| Live end-to-end test (person moving hands) | **PENDING** — needs the web bridge + a person (§5) |

Network path for everything: **`/project1/cbl`**. Particle ops are listed in
the 2026-05-26 handoff ("Particle ops actually built this session").

---

## 3. THE bug to fix first — particles stack at center

**Symptom:** `p_render` shows max brightness only at center (640,360); nothing at
the expected hand pixels (~384,302 and ~896,302).

**Verified facts (so you don't re-debug these):**
- `p_sim` positions are CORRECT: X≈[-0.23,0.23], Y≈0.045 — gathered to the two
  still hands. Physics works.
- `p_chop` (toptoCHOP) has channels **r,g,b,a with 2048 samples**, correct values
  (`r[0]≈-0.207`). The data is there and correct.
- Material/camera/render WORK — a bright quad renders at center.
- So `p_geo` is **ignoring `instancetx`/`instancety`** and drawing every instance
  at origin.

**Recommended fix (most reliable TD path): instance from a SOP, not a TOP→CHOP.**
This is pre-implemented as `fix_particles()` in `td/resume_build.py` (untested —
TD was down when written; adjust param tokens if rejected).
TOP→CHOP→instance translate is finicky across TD versions. The robust path:
1. `choptoSOP` (or `toptoSOP` off `p_null`) → 2048 points carrying position in P.
2. Point `p_geo.par.instanceop` at that SOP.
3. `p_geo.par.instancetx = 'P(0)'`, `instancety = 'P(1)'`, `instancetz = 'P(2)'`.
4. Re-cook `p_geo`; a cluster should appear at the hand pixels.

**If you instead keep the TOP/CHOP path, check in this order** (from the 2026-05-26
handoff §"THE BUG TO FIX FIRST"):
1. Confirm the quad actually made it into `p_geo`'s In SOP (open `p_geo`, check
   the internal geo isn't empty — if empty, only a default renders).
2. Verify instancing is truly on (`instanceactive`) and `instancetx/ty` accept
   bare channel names `r`/`g`.
3. `instancecountmode`: confirm `oplength` counts SAMPLES (2048) not channels (4).
   It's currently `manual`+`numinstances=2048` — re-cook after any change.
4. Sanity: a particle at X=0.2 with cam `orthowidth=1` at 1280px must land at
   screen x=(0.2+0.5)*1280=896. If translate applied, it's visible there.

**Coordinate convention (already baked in — do not re-flip):** `pose_ws_cb` flips
Y (`v = 1 - y`). World mapping: `x = u - 0.5`, `y = (v - 0.5) * 0.5625`.

**When a cluster appears at the hand pixels, the headline feature works** → move on.

---

## 4. Remaining steps after the bug (in order)

Detailed GLSL/uniform specs are in the 2026-05-26 handoff §5. Steps 1–2 below are
pre-implemented as `build_aura()` and `composite()` in `td/resume_build.py`. Summary:

1. **`aura_warp`** (handoff §5 Step 2): one glslTOP 1280×720, radial torso glow
   domain-warped toward each hand, BPM/chakra tinted. Uniforms read `pose`,
   `audio_out`, `heartbeat` via the `vec0name`/`vec0valuex` expression pattern
   used by `cymatics`/`aurora`.
2. **Composite** (handoff §5 Step 3): insert before `master_level`:
   `comp_aur → comp_bloom (add, +bloom_out) → comp_aura (screen, +aura_warp) → master_level`.
   Reconnect `master_level` input to `comp_aura`.
3. **Save safely** (handoff §5 Step 4): disable any live audio op first; verify
   `project.name`; **delete `cbl.toe` then `project.save(...)`** (MCP auto-declines
   overwrite prompts). Promote WIP → `cbl.toe` only when verified.

---

## 5. How to verify the feature live

1. TD open (WIP file), MCP responding.
2. Start the web app with the pose bridge ON:
   ```powershell
   $env:VITE_TD_BRIDGE = '1'; npm run dev
   ```
   (or in browser devtools: `localStorage['td-bridge']='1'`, then reload.)
3. Open http://localhost:5173, allow camera + mic.
4. In TD: `pose_ws` DAT shows 1 connected client; `pose` CHOP channels change as
   you move your hands.
5. **Hold a hand still → particles gather to it. Move it fast → they scatter.**
6. View `master_out` for the full composite.
7. `op.TDAPI.CheckErrors(op('/project1/cbl'), recurse=True)` → no errors.

---

## 6. Hard-won gotchas (do not relearn the hard way)

- **TD boot hang at ~348MB / no window = GPU init hang → reboot.** (This session.)
- **Audio device hangs TD on this machine.** Never save `cbl.toe` with a live
  `audiodeviceinCHOP`. Bowl mic is added only on the demo laptop via
  `enable_bowl_audio.py`.
- **`project.save()` over an existing file returns False** (auto-declines
  overwrite). Delete the file first, then save.
- **TD caches errors at frame boundaries** — fix in one `td_execute`, check
  errors in a **separate** call.
- **TD param names are unpredictable** — `op.TDAPI.GetParameterList('typeName')`
  before setting anything unfamiliar. Use `op.TDAPI.CreateOp` / `CreateGeometryComp`.
- **The web pose bridge is gated OFF by default** (so the laptop canvas demo runs
  without TD). Only set `VITE_TD_BRIDGE=1` in TD-connected sessions.

---

## 7. One-line status for the group

> The hands-control-the-particles effect is built and the physics works; one
> rendering bug is left (particles draw in the wrong spot). What you saw was the
> basic visual file with no bowl sound playing, so the grid looked static. The
> reactive version is a separate file that's nearly done.
