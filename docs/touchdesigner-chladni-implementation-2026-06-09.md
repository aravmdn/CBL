# Chladni math — IMPLEMENTED in `cbl.toe` (2026-06-09)

_What was actually built, the math behind it in plain language, and how to tune it.
Companion to the research/plan doc `docs/touchdesigner-chladni-particles-2026-06-01.md`
(paper citations + the full tutorial breakdown). Source video: Factory Settings,
"Audioreactive particles with Chladni Cymatics in TouchDesigner" (`youtu.be/MpnKDIBTk7c`).
Cleaned transcript verified against the 06-01 breakdown — no corrections needed._

> **STATUS: Option A DONE & saved in `cbl.toe` (2026-06-09).** The `cymatics` layer now
> renders the **true square-plate Chladni figure** (Ritz 1909 superposition) instead of the
> old separable `sin(kx)·sin(ky)` grid. The bowl pitch chooses the figure; the heartbeat
> makes it breathe. **Option B (particles collecting on the nodal lines) is the next step —
> plan is in the 06-01 doc §6 Option B; not built yet.**

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

## 7. What's next — Option B (particles on the nodal lines)

The video's headline effect is **GPU particles migrating onto the nodal lines** (sand
settling). We already have the particle feedback sim (`p_sim`) and the figure (this doc), so
Option B is an **additive force**, not a new system. The concrete, verified plan is in
`docs/touchdesigner-chladni-particles-2026-06-01.md` §6 Option B:
1. `cymatics` → `Threshold TOP` → `Normal TOP` (square buffer) to make a **normal map**.
2. In `p_sim`, sample the normal map at each particle's position and add
   `vel += (normal.rg*2-1) * uChladniGain` (the **key trick**: R/G as a 2-D velocity pulls
   particles in from all directions and stops them on the lines; grayscale only drifts sideways).
3. Add `dFdx/dFdy` jitter so particles don't all stack on one point.
4. Crossfade `uChladniGain` against the existing hand gather/scatter — **"the bowl arranges
   the particles; your hands disturb them."** Strong narrative beat for 19 June.

Estimated ~half a day; reuses `p_sim`. Ask and I'll build it.

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

## 9. Files

| File | What |
|---|---|
| `td/cbl.toe` | `cymatics` now renders the Chladni superposition (this doc) |
| `td/cbl.toe` → `cymatics_pixel` | the annotated GLSL shader |
| `docs/touchdesigner-chladni-particles-2026-06-01.md` | research paper + full tutorial breakdown + Option B plan |
| `EngineeringArt CBL/chladni_simulation.m` | the teammate's original MATLAB cymatics (the seed) |
