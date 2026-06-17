# Chladni math — IMPLEMENTED in `cbl.toe` (2026-06-09)

_What was actually built, the math behind it in plain language, and how to tune it.
Companion to the research/plan doc `docs/archive/touchdesigner-chladni-particles-2026-06-01.md`
(paper citations + the full tutorial breakdown). Source video: Factory Settings,
"Audioreactive particles with Chladni Cymatics in TouchDesigner" (`youtu.be/MpnKDIBTk7c`).
Cleaned transcript verified against the 06-01 breakdown — no corrections needed._

> **STATUS: Option A DONE & saved in `cbl.toe` (2026-06-09).** The `cymatics` layer now
> renders the **true square-plate Chladni figure** (Ritz 1909 superposition) instead of the
> old separable `sin(kx)·sin(ky)` grid. The bowl pitch chooses the figure; the heartbeat
> makes it breathe. **Option B is now also DONE (2026-06-09):** the flowing ink settles onto
> the nodal lines when the bowl rings — see §7 for the as-built details.

---

## 1. What this is, in one paragraph (for everyone)

A **Chladni pattern** is what you get when you sprinkle sand on a metal plate and vibrate it
at a musical note: the sand bounces away from the parts that move and **collects along the
"nodal lines" that stay still**, drawing a clean geometric figure. Different notes →
different figures. We are reproducing that mathematically: our singing **bowl's pitch picks
the figure**, and the **heartbeat makes it gently breathe**. This directly ties three of our
disciplines together in one visual — sound (signal), plate physics (maths), and the body
(heartbeat).

---

## 2. The maths (plain, then exact)

### Plain version
Two simple wave patterns are laid over the square plate and **subtracted** from each other.
Where they exactly cancel, the plate doesn't move — that's a nodal line, and that's where we
draw a glowing line. Two whole numbers, **n** and **m**, say how many waves fit across the
plate in each direction; changing them changes the figure.

### Exact equation (square plate, the one Paul Bourke / the video use)
```
f(x, y) = cos(n·π·x)·cos(m·π·y)  −  cos(m·π·x)·cos(n·π·y)
```
- `x, y` — position on the plate, normalised to `0…1`.
- `n, m` — **integer mode numbers**. `n = m` is degenerate (blank), so we always keep `n ≠ m`.
  Swapping `n` and `m` gives the *same* figure (the equation is antisymmetric).
- The **nodal lines** are exactly the curves where `f(x, y) = 0`. We light those up.

This is the **antisymmetric superposition of two degenerate vibration modes of a square
plate** — lineage **Walther Ritz, 1909** (the Rayleigh–Ritz method, invented to explain
Chladni's square-plate figures). The frequency↔mode-count relationship (why two integers)
is **Chladni's law, Rossing 1982**. Full citations: 06-01 doc §1.

### What we changed vs. the old look
| | Old `cymatics` (until 06-09) | New `cymatics` (now) |
|---|---|---|
| Field | `sin(k·x)·sin(k·y)` — a **separable grid** | `cos·cos − cos·cos` — **true plate figure** |
| Controlled by | one frequency `k` | two integers `n, m` + a breathing scale |
| Physics | a stand-in lattice | the actual square-plate eigenmode superposition |
| Look | smooth coloured bands | **glowing nodal lines** (sand-on-plate) |

---

## 3. Where it lives in `cbl.toe`

- **`cymatics`** (glslTOP) — runs the shader. Pixel shader DAT: **`cymatics_pixel`**.
- It feeds **`comp_cym`** and **`flow_src`** (unchanged wiring) → the existing flow/composite
  chain → `master_out`. Nothing downstream changed.
- The figure is driven entirely through the glslTOP's **vector uniforms** (TD's
  `vecNname` / `vecNvaluex` expression pattern — the same convention every other shader in
  this project uses):

| Uniform | Slot | Fed by (live expression) | Meaning |
|---|---|---|---|
| `uTime`  | vec0 | `absTime.seconds` | animation clock |
| `uAudio` | vec1 | `(energy, peakHz, beat³)` from `audio_out` + `heartbeat` | brightness + pulse |
| `uHue`   | vec2 | `audio_out['hue']` | chakra colour |
| **`uMode`** | **vec3 (NEW)** | see §4 | **`(n, m, breathScale, phase)`** |

---

## 4. How the bowl & heartbeat drive the figure (the "logic")

All four `uMode` components are TD parameter expressions on the `cymatics` glslTOP
(`vec3valuex…w`). Plain English + the actual expression:

**`n` (vec3valuex) — first mode number, from the bowl pitch**
```python
max(2, min(9, round(2 + (op('audio_out')['peakHz']-300)/120)))
```
Maps the detected bowl frequency to an integer `2…9`. It is **quantised (rounded)** on
purpose: a small pitch wobble keeps the same figure, but a real pitch change **steps** to a
new one — matching how the video re-randomises `n`/`m` to switch figures.

**`m` (vec3valuey) — second mode number**
```python
max(3, min(12, round(2 + (op('audio_out')['peakHz']-300)/120) + 3))
```
Always `n + 3`, clamped `3…12`, so **`n ≠ m`** is guaranteed (otherwise the figure vanishes).

**`breathScale` (vec3valuez) — the heartbeat breathing (acts like the video's `L`)**
```python
0.95 + 0.12*max(0.0, op('heartbeat')['beat']) + 0.03*math.sin(absTime.seconds*0.15)
```
Gently zooms the plate coordinates around the centre each heartbeat (`0.95 → ~1.07`), so the
whole figure **expands and contracts on the pulse**, plus a slow ambient drift so it's alive
even with no strong beat. This is our equivalent of "animate the length variable L" from the
tutorial.

**`phase` (vec3valuew)** — `absTime.seconds`, spare drift channel for future use.

> **Brightness is bowl-driven by design.** With no bowl playing, `energy ≈ 0`, so the figure
> is faint. Strike/play the bowl and the nodal lines light up — the sound literally "draws"
> the plate. On the demo laptop, enable the live bowl mic with `td/enable_bowl_audio.py`.

---

## 5. The shader, annotated

Full code is in `cymatics_pixel` inside `cbl.toe` (heavily commented in-place). The core:

```glsl
// Antisymmetric superposition of two degenerate square-plate modes (Ritz 1909).
// p in [0,1]^2 plate coords. Nodal lines = where this returns 0.
float chladni(vec2 p, float n, float m){
    float a = cos(n*PI*p.x) * cos(m*PI*p.y);
    float b = cos(m*PI*p.x) * cos(n*PI*p.y);
    return a - b;                 // signed plate displacement field
}
...
float f     = chladni(p, n, m);
float nodes = 1.0 - smoothstep(0.0, 0.05, abs(f));  // bright glow ON the nodal lines
```
- `p` = screen UV mapped to `0…1` plate space, **aspect-corrected** (the plate stays square on
  our 16:9 stage) and scaled by `breathScale` (the heartbeat).
- `abs(f)` is small near nodal lines → `nodes` ≈ 1 there → a thin bright line (the "sand").
- A faint fill of the antinode regions is mixed in (78% nodes / 22% fill) so it isn't a bare
  wireframe. Colour = chakra hue; final brightness = `(0.13 + energy + pulse) · vignette · field`.

---

## 6. How to tune it (no coding needed — just edit expressions on `cymatics`)

Open `cymatics` → **Vectors** page. Each value is an expression you can tweak:
- **Figures change too rarely / too often:** edit the `/120` divisor in `n`/`m` (smaller =
  more sensitive to pitch). Or change the `+3` offset in `m` for different figure families.
- **More/less breathing:** change `0.12` in `breathScale` (bigger = stronger heartbeat pulse).
- **Thicker/thinner nodal lines:** in `cymatics_pixel`, the `0.05` in
  `smoothstep(0.0, 0.05, abs(f))` — bigger = thicker, softer lines.
- **Lines vs. filled look:** the `0.78` in `mix(fill, nodes, 0.78)` — 1.0 = pure lines,
  0.0 = pure filled bands (closer to the old look).
- **Brightness without the bowl:** raise the `0.13` base in the `bright` line.

After editing in TD, **save mic-free** (delete `cbl.toe` then `project.save(path)`; never save
with a live `audiodeviceinCHOP` — it hangs TD on this machine). See `td/README.md`.

---

## 7. Option B — flowing ink settles on the nodal lines (DONE 2026-06-09)

The video's headline effect is matter **migrating onto the nodal lines** (sand settling). The
tutorial uses discrete GPU particles. **We chose to keep our flowing-ink aesthetic instead**
(decision 2026-06-09): we bias the existing **flow feedback** toward the nodal lines, gated by
the bowl. When the bowl rings, the flowing colour gathers into the Chladni figure; when it's
quiet, the flow relaxes back to its ambient drift. (The old discrete 2048-particle system
`p_sim`/`p_render` stays dormant — it's no longer composited into the output.)

### How it works (the video's "normal-map velocity" trick, applied to the flow)
1. **`chladni_height`** (glslTOP) — grayscale Chladni field, `abs(f)`: **dark valleys ON the
   nodal lines**, bright between. Reuses the exact `chladni()` maths and the *same* `uMode`
   uniform as `cymatics`, so it tracks the bowl pitch and lines up 1:1 with the visible figure.
2. **`chladni_thr`** (Threshold TOP) → **`chladni_nrm`** (Normal TOP) — turns that height into
   a **velocity field**: the normal's R/G point toward the nodal lines and go to zero *on* the
   lines (so ink decelerates and pools there). This is the tutorial's key idea.
3. **`flow`** shader (`flow_pixel`) gains a 3rd input (`chladni_nrm`) and a `uChladni.x` gain.
   One added line advects the ink along that velocity field:
   ```glsl
   vec2 cv  = texture(sTD2DInputs[2], uv).rg*2.0 - 1.0;     // dir toward nodal lines
   vec2 puv = uv - (fl*warp*(1.0 - min(0.85, g*4.0)) + cv*g*1.6);
   ```
   The ambient procedural warp (`fl`) **fades out as the gain `g` rises**, so the figure
   becomes legible instead of being smeared by the ambient flow.
4. **Trigger:** `uChladni.x` is bound to **smoothed bowl energy**
   (`min(0.18, max(0.0, audio_out['energy'])*0.25)`). Quiet → 0 → the flow looks like before;
   bowl ring → the ink snaps onto the figure. Since `cymatics` is also injected into the flow
   and brightens with energy, the lines light up *and* the flow gathers onto them together.

### Tuning (no rebuild needed)
- **Strength of the snap:** the `*0.25` in the gain expression (bigger = snaps harder) and the
  `cv*g*1.6` factor in `flow_pixel`.
- **How much the ambient flow yields:** the `g*4.0` term (bigger = the figure dominates sooner).
- **Cleaner vs. softer lines:** `chladni_thr` threshold/soften.
- **If the snap flickers with the real bowl:** insert a `lagCHOP` on `audio_out['energy']`
  before the gain expression for a smooth snap-in / relax-out (not added yet — needs a live
  bowl to tune).
- **Sign:** if a future change makes the ink flee the lines instead of gathering, flip the sign
  of `cv` in `flow_pixel` (the normal-orientation / v-flip gotcha; verified correct as built).

### Verified
A/B with the bowl faked bright: gain 0 = smooth ambient ink; gain 0.16 = the flow visibly
organises into the diamond-cell Chladni figure (rings inside each cell). Network error-free,
quiet state unchanged (gated), saved mic-free.

### Live-test status (2026-06-09) — ⏸️ RESUME HERE
Tested with the live **computer mic** (`enable_bowl_audio.py` → `bowl_mic → spectrum →
audio_out`).
- ✅ **Frequency → figure CONFIRMED live:** a played tone read `peakHz=963 Hz → n=8, m=11`,
  `chakra=6`, `hue=0.80`. The figure is genuinely chosen by the detected **pitch**, as designed
  (not by loudness).
- ⛔ **Snap / energy calibration NOT yet verified** — testing happened in a loud room, so the
  mic picked up ambient sound and a clean sustained bowl tone couldn't be isolated. Observed
  `energy ≈ 0.007` (near-silent) → gain ≈ 0.0018 (off). So the bowl-ring snap was never seen
  with a real signal.

**Next session (quiet room + the real bowl):**
1. Re-enable the mic: paste `td/enable_bowl_audio.py` into the TD Textport.
2. Play a sustained tone; read `op('/project1/cbl/audio_out')['energy']` live to learn the
   **actual energy range** a real bowl produces on this mic.
3. Recalibrate the gain expression on `flow.vec1valuex` (currently
   `min(0.18, max(0.0, audio_out['energy'])*0.25)`) so a normal strike reaches ~0.12–0.18 gain
   — almost certainly needs a **larger multiplier** if the laptop-mic energy is small.
4. If `energy` is jumpy, insert a `lagCHOP` on `audio_out['energy']` before the gain for a
   smooth snap-in / relax-out.
5. Confirm end-to-end: strike the bowl → ink snaps onto the figure; quiet → relaxes.

⚠️ The live mic is **runtime-only**. Do NOT save `cbl.toe` while it's enabled (audio-device
save-hang); run `disable_bowl_audio()` first. The committed `cbl.toe` is mic-free and current,
so it's safe to just close TD **without saving**.

---

## 8. For the report

- **Citations:** Chladni's law → **Rossing, T. D. (1982),** _Am. J. Phys._ 50(3), 271–274.
  The figure formula → **Ritz, W. (1909),** _Ann. Phys._ 28, 737–786. Modern numerical
  treatment → **Tuan et al. (2015)** or **Müller (2013)**. (Full refs: 06-01 doc §8.)
- **Discipline story:** bowl frequency (signal processing) → `(n, m)` mode numbers (plate
  physics) → glowing nodal figure (graphics/CS) → chakra colour (the teammate frequency
  table) → heartbeat breathing (hardware). One effect, five disciplines visible.
- **Bowl reality check:** Alice measured the real bowl at ~629–652 Hz. That narrow band maps
  to a stable `(n, m)` figure that *breathes* via the heartbeat — so even one sustained note
  gives a living image rather than needing big pitch swings.

---

## 10. 2026-06-12 — Alejandra port (glow + sand-grain + idle attract) — DONE

Teammate **Alejandra** built a standalone square-plate Chladni visualizer
(`td/experiments/alejandra-chladni/EngineeringArt_TouchDesign.10.toe`) — an independent
re-implementation of the same Ritz math. We ported three of her techniques into our
`cymatics`/flow layer (full analysis + extraction: `docs/touchdesigner-alejandra-chladni-port-2026-06-12.md`).
Verified live via MCP, error-free, saved mic-free.

1. **Soft Gaussian glow** (`cymatics_pixel`). The nodal-line term changed from a hard
   `1.0 - smoothstep(0.0, 0.05, abs(f))` to Alejandra's luminous falloff
   `exp(-f*f / 0.005)` (σ² tunable 0.004–0.006). Same peak-on-the-line, same range
   `[0,1]` — just a soft glow instead of a hard stroke.

2. **Idle ambient drift / attract state.** The `n`/`m` expressions on **both** `cymatics`
   and `chladni_height` now fall back, when the bowl is quiet (`audio_out['energy'] ≤ 0.02`),
   to a slow integer cycle `n = 3 + int(absTime.seconds/6)%5`, `m = n + 3` (steps every 6 s
   through `n∈{3..7}, m=n+3`, always `n≠m`). The instant a bowl note pushes energy above
   0.02, they snap back to the `peakHz → (n,m)` mapping. The figure is faintly visible when
   idle because `uAudio.x` already carries a `0.45 + 0.35*sin` ambient term — so no extra
   idle base-glow was needed (it would only have eaten the bowl's dynamic range).

3. **Sand-grain accumulation layer** (the headline). New ops under `/project1/cbl`:
   - `chladni_sand_pixel` (text DAT) — adapts Alejandra's `sand_pixel` to **our `−`
     antisymmetric chladni** and the **shared `uMode`**. Per-frame hash speckle jitter near
     the nodal lines, feedback accumulation `acc = min(prev*0.94 + grain*0.28, 1)` (raw `acc`
     kept in **alpha** for clean readback; warm→chakra tint in rgb, scaled `*0.7` for a subtle
     additive composite). Coordinate build (aspect, scale, warp) matches `cymatics` exactly so
     grains land on the visible lines.
   - `chladni_sand` (glslmultiTOP, 1280×720) — uniforms `uTime`/`uHue`/`uMode` copied from
     `cymatics` + new `uGain` = `min(1.0, max(0.10, audio_out['energy']*5.0))` (bowl gate with
     a small idle floor so the attract state still has faint texture). Input[0] = its feedback.
   - `chladni_sand_fb` (feedbackTOP) → target `chladni_sand`.
   - `comp_sand` (compositeTOP, `add`) = `chladni_sand` over `comp_flow`; `comp_bloom`'s first
     input repointed `comp_flow → comp_sand`. Fully reversible (repoint back + delete 3 ops).
   - **Flow-gather eased** so grain + flow don't double-emphasize: `flow.vec1valuex`
     `min(0.18, energy*0.25)` → `min(0.13, energy*0.18)`.

   Behaviour: bowl quiet → faint granular texture on the slowly-cycling idle figure; bowl
   strike → `uGain→1`, grain piles up bright on the nodal lines and re-settles (×0.94/frame)
   as the figure drifts or the pitch changes. Discrete "sand on the plate", on-concept.

**Live-tuning knobs** (no rebuild): glow width `exp(-f*f/0.005)`; idle period `/6.0` & range
`%5`; sand idle floor `0.10` / gate `*5.0`; grain build `*0.28` & relax `*0.94`; display gain
`*0.7`; composite `comp_sand` operand (`add`↔`screen`); flow-gather `*0.18`. If the sand looks
too busy live: set `flow` gain to 0 and let grain fully own the nodal lines (the "grain
replaces Option B" fallback).

---

## 9. Files

| File | What |
|---|---|
| `td/cbl.toe` | `cymatics` now renders the Chladni superposition (this doc) |
| `td/cbl.toe` → `cymatics_pixel` | the annotated GLSL shader (now with Gaussian glow, §10) |
| `td/cbl.toe` → `chladni_sand`/`chladni_sand_pixel`/`chladni_sand_fb`/`comp_sand` | sand-grain layer (§10) |
| `docs/touchdesigner-alejandra-chladni-port-2026-06-12.md` | Alejandra extraction + port plan (§10) |
| `td/experiments/alejandra-chladni/EngineeringArt_TouchDesign.10.toe` | Alejandra's original standalone file |
| `docs/archive/touchdesigner-chladni-particles-2026-06-01.md` | research paper + full tutorial breakdown + Option B plan |
| `EngineeringArt CBL/chladni_simulation.m` | the teammate's original MATLAB cymatics (the seed) |

---

## 11. 2026-06-16 — real pitch detection + continuous morph + modes decoupled from loudness — DONE

Three connected problems were fixed (committed `4897f88`, `09ca746`). All logic-verified; **live aesthetic tuning with the real bowl in a quiet room is still pending.**

### 11a. The detector was frozen (the real root cause)
The figure wasn't changing with pitch because `audio_out`'s `peakHz` was stuck at its silent default (~220 Hz). The actual cause was upstream: the `spectrum` (audiospectrumCHOP) was in **log/visual display mode** — `frequencylog=1` + `highfreqboost=0.75` — so the bin→Hz axis the detector assumed (`binHz=(rate/2)/numSamples`, linear) was wrong, and the HF boost amplified an ~11 kHz junk spike that broke the old confidence gate.

- **Fix:** force `spectrum.frequencylog=0`, `highfreqboost=0` (linear). The mic + `spectrum` are **not saved** in `cbl.toe` (added on demand), so `td/enable_bowl_audio.py` now sets these **every session** — otherwise the detector breaks again on re-enable.
- **Detector rewrite** (`audio_out_callbacks`): band-local noise floor (mean over 120–2000 Hz only, not the whole spectrum), a **harmonic-product-spectrum** fundamental finder (resolves octaves for harmonic bowls/kalimba) plus band-argmax for near-pure tones, parabolic interpolation, and a confidence test that **holds the last confident pitch** on silence/noise (never freezes mid-note). Outputs unchanged: `peakHz, hue, energy, chakra`. `hue`/`chakra` = nearest Solfeggio for **colour only**. Energy convention: ambient/quiet ≈ 0.02–0.06, a clear note ≈ 0.3–1.0 (cap ~1.5).
- Synthetic tests through the live op: 220/440/528/880 Hz exact; 256/512/741 Hz (forks) exact; noise rejected.

### 11b. The figure now MORPHS between patterns (no snapping)
`(n,m)` used to be `round()`ed to integers → the figure popped between figures. Now:
- `chladni_mode_src` (constantCHOP) emits **continuous float** `n,m` (the same log-frequency pitch map, un-rounded) → `chladni_mode_lag` (lagCHOP 0.35/0.70) smooths them. All three figure ops (`cymatics`, `chladni_height`, `chladni_sand`) read `op('chladni_mode_lag')['n'/'m']`.
- `cymatics_pixel` (and the other two shaders) gained `chladniMorph(p,n,m)`: it evaluates the **four bracketing integer figures** `chladni(floor/ceil n, floor/ceil m)` and **bilinearly crossfades** by `fract(n)`/`fract(m)`. At integers the weights collapse to one corner → an identical clean figure; in transit a continuous blend. Degenerate corners (`ni==mi` → blank) are zero-weighted and renormalised → never collapses to blank.

### 11c. Modes follow pitch at ANY loudness (decoupled from the energy gate)
Previously `(n,m)` only followed `peakHz` when `chladni_energy_lag['energy'] > 0.10`; real playing sat ~0.06 → stuck in idle drift, so notes didn't change the figure. Now:
- `chladni_mode_src` follows `peakHz` **always** (the detector holds its last confident pitch, so it's essentially always a valid musical pitch), and crossfades toward a slow idle drift only via `chladni_silence` (constantCHOP, `sil=1` when energy < 0.020) → `chladni_silence_lag` (lagCHOP, **6.0 s rise / 0.25 s fall** — idle only after ~6 s of true silence, snaps back to pitch in ~0.25 s).
- **Brightness floor** raised in `cymatics_pixel` (`intensity = 0.55 + min(0.45, energy*0.9) + pulse*0.30`) + tighter nodal glow (`/0.0016`) + higher nodal mix (0.90) so the current figure is always legible and fine figures don't drown in fill. `chladni_sand` `uGain` idle floor 0.10→0.30 to match.

### 11d. Aura reacts to pitch + a stutter was fixed (the `flow` layer)
- **Pitch→motion:** `pitch_src` (constantCHOP: `pnorm` = log-map of `peakHz` 120–2000→0..1; `egate` = energy gate) → `pitch_lag` (lagCHOP) → `flow` uniform `uPitch`. Higher pitch → finer/faster swirls, gated by energy so silence stays calm.
- **Stutter fix:** `flow_pixel` used to compute `tp = absTime.seconds*0.07*timeMul` — multiplying an ever-growing time by a pitch-varying rate makes the phase **jump every frame**. Flow time now comes from an **integrated phase** (`flow_rate` constantCHOP → `flow_phase` speedCHOP), which stays continuous when the rate changes; `kf` is constant. Result: smooth flow even while pitch changes.
- **Finger control** made snappier/grippier: `hands_lag` 0.06→0.04, `uFingerCfg` radius 0.075→0.10 / force 0.05→0.09 / dye 0.06→0.08, `flow` fade 0.95→0.96. (Mirror was already correct: finger `u=1-x` matches the `camera_flip` flipx display.)

### 11e. New ops (must persist in the save)
`chladni_mode_src`, `chladni_mode_lag`, `chladni_silence`, `chladni_silence_lag` (figure); `pitch_src`, `pitch_lag`, `flow_rate`, `flow_phase` (aura). `chladni_energy_lag` (from the gate work) also persists.

### 11f. Live-tuning knobs (no rebuild)
Figure: silence floor `chladni_silence` (0.020) + dwell `chladni_silence_lag.lag1` (6 s); brightness floor (0.55) and glow width (`/0.0016`) in `cymatics_pixel`; mode smoothing `chladni_mode_lag` (0.35/0.70). Aura: pitch→speed gain in `flow_rate` (`*0.5`); finger feel `hands_lag` (0.04) + `flow.vec12` (radius/force/dye) + fade `flow.vec0valuex` (0.96).
