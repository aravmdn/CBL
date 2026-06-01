# Audio-Reactive Chladni Particle Plate — full breakdown, the source paper, and a graft plan for `cbl.toe`

_Created 2026-06-01. Source video: **"Audio Reactive Chladni Plate" by Factory Settings**
(`youtu.be/MpnKDIBTk7c`, Patreon `factory settings`). This doc captures (1) the research
paper behind it, (2) a heavily-annotated rebuild of the whole TouchDesigner network the
video constructs, and (3) a concrete sketch for grafting the key technique — a **normal-map
velocity field that pulls a GPU particle system onto the nodal lines of a cymatic pattern** —
onto our existing `td/cbl.toe`._

Relevant CBL tasks: **Alejandra — "TouchDesigner (Chladni Formula)"**, and **Arav/Alejandra —
"continue with TouchDesigner"** (Meeting 6.2 task division, 2026-05-29). See `CLAUDE.md` →
Pending, and `docs/touchdesigner-visual-redesign-2026-05-29.md` for the current cymatics look.

---

## 0. TL;DR

The video builds a particle system on the GPU whose particles **migrate onto the nodal
lines of a Chladni (cymatic) plate pattern**, exactly like sand collecting on a vibrating
metal plate. It does this entirely with TOPs/CHOPs/SOPs plus **one GLSL feedback shader**.
The single most important idea — and the one worth stealing for CBL — is:

> Don't push particles with the *grayscale* pattern (that only moves them sideways).
> Convert the pattern to a **normal map**, and read the **R/G channels as a 2-D velocity
> vector** so particles are pulled toward the dark nodal lines **from every direction**,
> slowing to a stop when they arrive. Add `dFdx/dFdy` derivative jitter so they don't all
> pile onto the exact same pixel.

Audio reactivity is then just: take a beat envelope from an `Audio Spectrum CHOP`, and wire
it onto the **`L` ("plate size") variable** of the Chladni equation so the pattern wobbles
on the beat; (optionally) re-randomize the mode numbers `n, m` on a trigger to change the
figure.

---

## 1. The research paper (this is the part you asked me to find)

The video never names a journal article — on screen the narrator only says _"if you're
searching for a Chladni equation you stumble upon this very informative website by **Paul
Bourke**."_ So the chain is **video → Paul Bourke's page → the paper Bourke is built on**.

### 1.1 The primary paper (what "goes alongside this")

> **Thomas D. Rossing, "Chladni's law for vibrating plates," _American Journal of Physics_
> **50**(3), 271–274 (1982).** DOI: [10.1119/1.12866](https://doi.org/10.1119/1.12866).

This is the research paper Paul Bourke's Chladni page cites first, and it is the canonical
source for the relationship the whole simulation rests on. Rossing formalises **Chladni's
law**: modes are labelled by a number of nodal lines, and adding one nodal circle raises the
frequency about as much as adding **two** nodal diameters — i.e. for large `f`,
`f ∝ (m + 2n)^p`. That `(m, 2n)` mode-counting is precisely why the video's pattern is
indexed by two integers **`n` and `m`** and why swapping them is meaningful.

Paul Bourke's page (the video's literal source) also cites, for completeness:
- Elmore & Heald, _Physics of Waves_ (Dover).
- C. M. Hutchins, "The acoustics of violin plates," _Scientific American_, Oct 1981, 170–176.
- N. H. Fletcher & T. D. Rossing, _The Physics of Musical Instruments_, Springer, 1991.

### 1.2 The equation's deeper origin (square plate, free edges)

The exact closed form the video reconstructs —

```
cos(nπx/L)·cos(mπy/L)  −  cos(mπx/L)·cos(nπy/L)
```

— is the **antisymmetric superposition of two degenerate vibration modes of a square plate**.
Its lineage is **Walther Ritz (1909)**, _"Theorie der Transversalschwingungen einer
quadratischen Platte mit freien Rändern,"_ _Annalen der Physik_ **28**, 737–786 — the paper
that introduced the Rayleigh–Ritz method *specifically to explain Chladni's square-plate
figures*. This is the academic root if you want to cite the figure formula itself rather than
Chladni's law.

### 1.3 Modern companion papers (good for the report's "why")

If the report wants a contemporary, citable treatment of *reconstructing/simulating* Chladni
figures (which is exactly what the video does numerically), use either:

- **P. H. Tuan et al., "Exploring the resonant vibration of thin plates: Reconstruction of
  Chladni patterns and determination of resonant wave numbers,"** _J. Acoust. Soc. Am._
  **137**(4), 2113–2123 (2015). [DOI 10.1121/1.4916704](https://doi.org/10.1121/1.4916704) /
  [PubMed 25920861](https://pubmed.ncbi.nlm.nih.gov/25920861/). Reconstructs experimental
  Chladni patterns from an inhomogeneous Helmholtz response function and recovers the
  Kirchhoff–Love dispersion relation. (Same group: "Resolving the formation of modern Chladni
  figures," _EPL_ **111**, 64004, 2015 — point-driven figures with symmetry breaking.)
- **Thomas Müller, "Numerical Chladni figures,"** _European Journal of Physics_ **34**,
  1067–1074 (2013), arXiv:[1308.5523](https://arxiv.org/abs/1308.5523). An interactive
  **finite-element** tool ("NumChladni") for arbitrary 2-D membranes. This is the closest
  published analogue to "compute the figure numerically and visualise it," though it uses FEM
  eigenmodes rather than the closed-form cosine superposition the video uses.

**Bottom line for citing:** the paper that "goes alongside" the video is **Rossing 1982**
(via Bourke). The figure formula itself is **Ritz 1909**. For a modern simulation reference
use **Tuan 2015** or **Müller 2013**.

---

## 2. The physics & math used in the video

Chladni patterns are the **nodal lines** (zero-displacement curves) of a standing wave on a
vibrating plate. Sand bounces away from antinodes and settles where the plate doesn't move.

**Square plate, constrained at the centre** (the form the video uses):

```
f(x, y) = cos(nπx/L)·cos(mπy/L) − cos(mπx/L)·cos(nπy/L)
nodal lines where f(x, y) = 0
```

- `n, m` — integer **mode numbers**. They set how many subdivisions the figure has.
  `n = m` is degenerate/uninteresting; `(n₁,m₂)` and `(n₂,m₁)` give the same figure.
- `L` — effective **plate size / wavelength scale**. Animating `L` "breathes" the figure.
- `x, y` — pixel coordinates of a square texture (the video uses **300×300**).

**Edge-constrained / no centre support** (Bourke gives this too, simpler):

```
sin(nπx/Lx)·sin(mπy/Ly) = 0
```

> Our current `cbl.toe` `cymatics` glslTOP uses the simpler `sin(kx)·sin(ky)` interference
> with a single `k = frequency/80` (ported from the teammate MATLAB `chladni_simulation.m`).
> The video's two-mode `cos·cos − cos·cos` superposition is **richer** (true square-plate
> figures, not a separable grid). Swapping our `cymatics` to the superposition form is a
> small shader edit — see §6.

---

## 3. The full network the video builds (annotated rebuild)

Operator-by-operator, in build order. TD operator families in brackets. This is enough to
rebuild it from scratch.

### 3.1 Variables → a single Constant CHOP
- **`Constant CHOP`** holding three channels `n`, `m`, `l`. Start them all at `1`.

### 3.2 Pixel-position generator (the square domain)
Target a **300×300** texture, so `x` sweeps a row 0→300 and repeats 300 rows; `y` is constant
across a row then steps up.
- **`Pattern CHOP` (X):** Cycles `300`, Length `300² = 90000`. (X ramps 0→300 every row.)
- **`Pattern CHOP` (Y):** Length `300² = 90000`, **Number of steps `300`** (Y holds for a
  whole row, then increments).

### 3.3 Reconstruct `cos(nπx/L)·cos(mπy/L) − cos(mπx/L)·cos(nπy/L)` in CHOPs
For each cosine term:
- **`Math CHOP`** to compute `n·π·x / l` (multiply by `n` and `π`, divide by `l`).
- **`Function CHOP`** set to **Cosine**.
- Build the `y` term the same way using `m`.
- **Multiply** the two cosines (a `Math CHOP` in multiply mode, or combine).
- Build the **swapped** second term (`m` with `x`, `n` with `y`) identically.
- **`Math CHOP` → Combine → Subtract**: `term1 − term2`.

### 3.4 CHOP → TOP (turn the field into a texture)
- The equation output channel is **renamed `blue`** — deliberately, because later a normal
  map encodes its Z component in the **blue** channel. Pad with R and G via a
  **`Constant CHOP` + `Merge CHOP`** (order RGB top-down) → **`Null CHOP`**.
- **`CHOP to TOP`**, data format **RGB**, image layout **Fit to square**.
- Sweeping `n/m/l` now shows a live pattern.

### 3.5 Auto-explore the variables (a tiny script)
- **`LFO CHOP` → `Null CHOP` → `CHOP Execute DAT`** (in the **off→on** callback): write two
  random values (within a chosen interval) into the Constant CHOP's `n` and `m`. Leave `l = 7`.

### 3.6 Particle geometry
- **`Add SOP`** (add points) → **`Convert SOP`** (convert to particles, one per point), type
  **Point Sprites** → **`Null SOP`** → **`Geometry COMP`**. Initially one point at (0,0).

### 3.7 Instance the particles into a 300×300 grid
- **`Noise TOP`** at **300×300**, type **Random**, amplitude `1`, offset `0`. This is the
  per-particle data source → **`Null TOP`** → drives the **Geometry COMP**'s _Instance_ tab.
- **Switch off Monochrome** (otherwise R=G=B and particles fall on a diagonal line).
- **Drop the Z** from the instance tab → keep it flat (2-D plate).
- Set the Noise TOP to **32-bit float** so it can output **negative** values (−1…+1), not
  just 0…1. (Critical — without this the particle field can't span the centred domain.)
- Cache this as the **initial position** → **`Null TOP` named `initial`**.

### 3.8 Render path (so you can see it)
- Geometry material **Point Sprites** → **`Render TOP`** → **`Camera COMP`** →
  **`Transform TOP`** → **`Composite TOP`** over a background → alpha 1 → **`Null TOP`** →
  **`Out TOP`**. Render resolution **1280×1280** (set the same at project level). Frame the
  camera in panel mode.

### 3.9 Motion = a GLSL feedback loop (the core)
- **`GLSL Multi TOP`** ("GLSL TOP"): strip the default white-out so it passes the input
  through. Its output drives the instance transform.
- Add a velocity to positions, then **loop** the output back in with a **`Feedback TOP`**
  (initial → feedback target = shader output → feedback into the position input). This is the
  standard TD position-feedback construction.
- Start with velocity `1` → everything shears diagonally; drop to `~0.01` to see real motion.

### 3.10 Boundary reset (keep particles on the plate)
- Feed the **`initial`** texture into the shader's **2nd input** as the reset target.
- In GLSL: rename the working value to `position`. If `position.x` or `position.y` leaves
  `[-1, 1]`, snap it back to `initial`. (Later: use `±0.95` instead of `±1` to kill corner
  clustering — see §3.13.)

### 3.11 Velocity look-up from the pattern (first attempt — grayscale)
- Feed the **Chladni pattern texture** into the shader's **3rd input** as `velocity`.
- Sample it **at the particle's position**, not its own UV. Remap position `[-1,1] → [0,1]`
  for the texture lookup: `uv = position * 0.5 + 0.5`.
- Add `velocity.b * speed` to position. Add a **float uniform `speed`** (also declared in the
  shader's Vectors page) so you can scale the whole thing down.
- Result: particles drift toward dark spots — **but only sideways**. Grayscale can't tell a
  particle which *direction* a nodal line is. This motivates the normal map.

### 3.12 Velocity look-up done right — NORMAL MAP (the key trick)
- Convert the pattern to a normal map: **`Normal TOP`** (generates per-pixel surface
  direction) with a **`Threshold TOP`** in front (comparator **≤**, tune _threshold_ +
  _soften_) for clean color regions and smooth transitions.
- A normal map stores the surface direction as color: **R = X**, **G = Y**, **B = Z**
  (Z points at the camera → that's why the equation channel was named `blue`).
- In the shader, use **R and G as a 2-D velocity vector** (delete the `.b` usage). Remap the
  sampled color `[0,1] → [-1,1]` via `vel = texture(...).rg * 2.0 - 1.0`. Flat/low regions sit
  at (0.5, 0.5) → remap to (0,0) → **zero velocity**, so particles **decelerate and park on
  the nodal lines** while being pulled in **from all directions**. This is the "sand on the
  plate" behaviour.

### 3.13 Anti-clustering with screen-space derivatives
- Particles still pile onto identical points. The GPU can't cheaply let each pixel know every
  other pixel's position, but **`dFdx` / `dFdy`** give the rate of change vs. the neighbouring
  fragment — usable as cheap local jitter in dense areas.
- `vec2 derivative = ...; ` apply `dFdx/dFdy`, add to velocity, multiply by a small factor.
- **Tile + mirror** the normal map for symmetry. Use the `±0.95` boundary to remove the
  top-right corner clump.

### 3.14 Audio reactivity
- Drag in an audio file; **`Audio Device Out CHOP`** to monitor (off during build).
- **`Audio Spectrum CHOP`** (zero the smoothing extras for a crisp read). Beats/kicks live
  **low** in the spectrum.
- **`Analyze CHOP` → RMS Power** for a quick level. To isolate a band/transient, insert a
  **`Trend CHOP`** (Absolute, ~10-sample range) and drag the start onto a clear transient.
- **`Select CHOP`** (one channel) → **`Lag CHOP`** (nice ease-out fall-off) → **`Null CHOP`**.
- Wire that envelope onto the **`l` (length) variable** via an expression so the figure
  wobbles with the beat. If harsh, temper with a **`Math CHOP`** after Analyze.
- To **change the figure** on cue, fire the `n/m` re-randomize (§3.5) from a trigger — every
  bar, a MIDI note, etc.

---

## 4. Why each non-obvious step matters (cheat-sheet)

| Step | Why it's there |
|---|---|
| Channel named **`blue`** | Aligns with normal-map convention (Z = blue) so the same data reads naturally as a normal map later. |
| **32-bit float** noise | Allows **negative** positions; 8-bit clamps 0…1 and collapses half the plate. |
| **Normal map** velocity (R/G), not grayscale | Encodes a **direction** per pixel → omnidirectional attraction + deceleration at nodes. Grayscale only gives magnitude → sideways drift. |
| Remap `*2-1` and `*0.5+0.5` | Texture space is `[0,1]`; particle/plate space is `[-1,1]`. Two conversions bridge them. |
| **`dFdx/dFdy`** jitter | Cheap GPU-friendly "don't all stack on one pixel" without an O(N²) neighbour search. |
| `l` ← audio envelope | `l` scales the whole figure smoothly → musical "breathing"; changing `n/m` instead would *snap* to a new figure (good for downbeats). |
| `±0.95` boundary | Asymmetric reset value prevents a deterministic corner pile-up. |

---

## 5. Gotchas worth flagging before we build

- **It's a full particle-feedback build**, not a post-effect. Needs shader support (we have it
  — `cbl.toe` already runs `p_sim` as a GLSL feedback sim).
- The pattern texture must be **square** and the particle domain centred on `[-1,1]`; our
  stage is **1280×720 (16:9)**. Either run the Chladni sim in its own **square** buffer and
  composite, or carry an aspect correction (our `cymatics`/`aura_warp` already use
  `ASPECT = 0.5625`). Don't mix the two conventions in one shader.
- Normal/Threshold tuning is *taste*: aim for clean colour regions + smooth transitions, or
  the velocity field gets noisy.
- Patreon-gated extras (a tidier `.toe`, more features) are **not** in the free video.

---

## 6. THE SKETCH — grafting this onto `td/cbl.toe`

Goal: make our **bowl frequency** drive a **Chladni figure**, and have **GPU particles
collect on its nodal lines**, pulsing with the **heartbeat** — reusing as much of the
existing network as possible. Two options, smallest-first.

### Current relevant operators (from `td/README.md`)
- `cymatics` (glslTOP) — `sin(kx)·sin(ky)`, chakra-colored, aspect-correct. **Reuse/upgrade.**
- `p_init / p_fb / p_sim / p_null / p_chop / p_ctsop / p_geo / p_render / p_mat / p_sprite …`
  — the **2048-particle GLSL feedback sim** (gather to still hands / scatter from fast). This
  is *already* the §3.9–3.13 architecture — we don't need to build a particle system, only to
  **add a second force**: attraction to the Chladni field.
- `audio_out` (scriptCHOP) — bowl spectrum → `peakHz / hue / energy / chakra`. **The audio
  envelope source.**
- `heartbeat` (lfoCHOP) — beat 0..1. **Pulse source.**
- `pose` (nullCHOP) — `lWrist/rWrist/head/torso` UVs + speeds. **Hands.**
- Uniform convention: packed `vecN` uniforms bound by `resume_build.py` via the
  `vecNname / vecNvaluex` expression pattern (see `aura_warp.frag` header). **Follow it.**

### Option A — *Cheapest:* upgrade `cymatics` to the true square-plate figure (no particles)
A ~10-line shader edit, immediately better-looking, zero new operators.

1. In the `cymatics` glslTOP, replace `sin(kx)·sin(ky)` with the **two-mode superposition**:
   ```glsl
   // uMode.xy = (n, m) mode numbers ; uMode.z = L (plate size) ; uMode.w = phase/beat
   float chladni(vec2 p) {            // p in plate space, aspect-corrected
       float n = uMode.x, m = uMode.y, L = uMode.z;
       float a = cos(n*PI*p.x/L)*cos(m*PI*p.y/L);
       float b = cos(m*PI*p.x/L)*cos(n*PI*p.y/L);
       return a - b;                  // nodal lines where this == 0
   }
   // brightness from proximity to a nodal line:
   float field = abs(chladni(p));
   float nodes = 1.0 - smoothstep(0.0, 0.06, field);  // glow ON the nodal lines
   ```
2. Drive the inputs from existing data:
   - `n, m` ← integers chosen from the **bowl** (e.g. map `peakHz` band → a small `(n,m)`
     table; or re-randomize on a strong onset using `audio_out.energy`).
   - `L` ← a base value **modulated by `heartbeat.beat`** (breathing) and/or `audio_out.energy`.
   - colour ← existing `hue`/`chakra` (unchanged).
3. Bind `uMode` with the same `vecNname/vecNvaluex` expression pattern as the other uniforms.

> This alone realises Alejandra's "Chladni Formula" task with the *correct* physics and looks
> markedly better than the current separable grid. Recommended first step.

### Option B — *Full effect:* particles collecting on the nodal lines
Add the normal-map velocity force to the **existing** `p_sim` feedback shader.

```
                         ┌────────────────────────────────────────────┐
 audio_out (bowl) ─┐     │            NEW: Chladni field path          │
   energy/peakHz   ├────▶│  chladni_src (glslTOP, SQUARE buffer e.g.   │
 heartbeat.beat ───┘     │     512×512)  →  cos·cos − cos·cos          │
                         │        │                                    │
                         │        ▼                                    │
                         │  chladni_thr (Threshold TOP)                │
                         │        │                                    │
                         │        ▼                                    │
                         │  chladni_nrm (Normal TOP)  ── normal map ──┐ │
                         └───────────────────────────────────────────┼─┘
                                                                      │
   pose (hands) ──────────────────────────────┐                      │
                                               ▼                      ▼
   p_init ─▶ p_sim (GLSL feedback) ◀── add velocity term: vel += (normal.rg*2-1)*chladniGain
                  │                                  ▲ existing hand gather/scatter stays
                  ▼                                  │ + dFdx/dFdy jitter (already feasible)
            p_geo ─▶ p_render ─▶ (composite chain unchanged) ─▶ master_out
```

Concrete changes:
1. **New square field chain** (mirrors §3.3 done in-shader, simpler than the CHOP graph):
   `chladni_src` (glslTOP, **square** res, e.g. 512²) computes the superposition →
   `chladni_thr` (Threshold TOP) → `chladni_nrm` (Normal TOP). Feed `n/m/L` from bowl +
   heartbeat as in Option A.
2. **Feed the normal map into `p_sim`** as an extra input (e.g. input 3). In `p_sim`, sample
   it **at each particle's plate-space position** (remap `*0.5+0.5`) and add
   `vel += (sampleNormal.rg*2.0 - 1.0) * uChladniGain;` *before* the boundary clamp.
3. **Blend the two forces.** Keep the current hand gather/scatter; add a `uChladniGain`
   uniform so we can crossfade: hands dominate when someone reaches out, the Chladni
   attractor dominates when they're still → "the bowl arranges the particles; your hands
   disturb them." This is a genuinely strong narrative beat for the 19 June demo.
4. **Aspect:** run `chladni_*` square and convert plate-space ↔ stage-space using the existing
   `ASPECT = 0.5625` convention so particles still register against the 16:9 camera/aura.
5. **Audio onset → re-figure:** on a strong `audio_out.energy` transient, re-pick `(n,m)` so
   striking the bowl visibly *reorganises* the particle figure.

### Effort / risk
- **Option A:** ~30–60 min, shader-only, low risk, big visual win. **Do this first.**
- **Option B:** ~half a day; reuses `p_sim` so no new particle system, but needs careful
  force-blending and aspect handling. High payoff (it *is* the video's effect, tied to our
  bowl + heartbeat + hands).
- Both need **TD open on MCP :44444** with the network loaded; verify with `CheckErrors`
  before saving, and save **mic-free** (audio-device save-hang gotcha in `td/README.md`).

---

## 7. How this ties back to the project

- **Discipline coverage:** bowl frequency (signal) → `(n,m,L)` (physics/Rossing 1982) →
  particle migration (CS/GPU) → chakra colour (the teammate table) → heartbeat pulse
  (hardware). Every discipline shows up in one effect — directly answers the midterm feedback
  that "the idea wasn't visualised / too complex / not clearly explained."
- **Bowl reality check:** Alice measured the real bowl at **629–652 Hz** (Minutes 6.1). That
  narrow band barely moves the colour, but it maps cleanly onto **`L`/`(n,m)` modulation** —
  small pitch wobble → a *living* figure even from one note. Good argument for driving the
  figure from `L`/energy rather than expecting big chakra-colour swings.
- **Report:** cite **Rossing 1982** (Chladni's law) and **Ritz 1909** (the square-plate figure
  formula); optionally **Tuan 2015** / **Müller 2013** for the modern numerical treatment.

---

## 8. References

- Source video: Factory Settings, "Audio Reactive Chladni Plate," `https://youtu.be/MpnKDIBTk7c`
- Paul Bourke, "Chladni plate mathematics" — `http://paulbourke.net/geometry/chladni/`
- Rossing, T. D. (1982). "Chladni's law for vibrating plates." _Am. J. Phys._ 50(3), 271–274.
  [doi:10.1119/1.12866](https://doi.org/10.1119/1.12866)
- Ritz, W. (1909). "Theorie der Transversalschwingungen einer quadratischen Platte mit freien
  Rändern." _Ann. Phys._ 28, 737–786.
- Tuan, P. H. et al. (2015). "Exploring the resonant vibration of thin plates…" _J. Acoust.
  Soc. Am._ 137(4), 2113–2123. [doi:10.1121/1.4916704](https://doi.org/10.1121/1.4916704)
- Müller, T. (2013). "Numerical Chladni figures." _Eur. J. Phys._ 34, 1067–1074.
  [arXiv:1308.5523](https://arxiv.org/abs/1308.5523)
- Current CBL cymatics: `docs/touchdesigner-visual-redesign-2026-05-29.md`,
  `td/README.md`, `EngineeringArt CBL/chladni_simulation.m`.
