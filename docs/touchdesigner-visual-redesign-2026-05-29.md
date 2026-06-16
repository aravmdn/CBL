# TouchDesigner — Visual Redesign Spec: "seamless flow of colours"

_Direction set by Arav, 2026-05-29 — **BUILT the same day and verified live.** Kept as the
record of intent + how it was implemented._

> **STATUS: DONE (2026-05-29).** Smooth cymatics, liquid/ink feedback flow, and 10-fingertip
> glowing orbs (hand_landmarker) are all in `td/cbl.toe`. Final tuning: orb radius 0.022, flow
> warp 0.018 / fade 0.91. Fingertips chosen = **10 (hand_landmarker)**. Implementation notes
> below describe what was built.

## The look we're going for

| Element | Direction |
|---|---|
| **Cymatics** | **Keep** the bowl physics (`sin(kx)·sin(ky)`, `k = freq/80`, ported from the teammate's MATLAB) but **render it smooth** — no dots/lattice. Soft glowing continuous field / contours that flow. |
| **Overall feel** | **Liquid / ink** — colours swirl, bleed, and fold into each other like ink dropped in water. Seamless, no hard edges or grid. |
| **Colour driven by** | (1) **Bowl pitch → hue** (the chakra mapping), (2) **Heartbeat → pulse** (the whole field breathes with the beat), (3) **Ambient drift** (always slowly flowing on its own). NOTE: hands do **not** stir the colour field. |
| **Orbs / particles** | Anchored at the **FINGERTIPS**, not the wrists. Exact behaviour is open ("whatever looks pretty") — proposed default below. |
| **Pace** | Assumed calm / meditative (matches the bowl/relaxation theme) unless Arav says otherwise. |

## How to build it (concrete TD work, network `/project1/cbl`)

1. **Smooth cymatics** — edit the `cymatics` glslTOP pixel shader (`cymatics_pixel`):
   remove any thresholding/quantisation that creates the dot lattice; output a smooth
   normalised field, map it to the chakra hue, add a soft bloom/contour glow. Keep the
   `k = freq/80` math so it still reacts to the real bowl frequency.

2. **Liquid/ink flow** — add a feedback loop on the colour field so it advects each frame:
   a `feedbackTOP` + a domain-warp (curl/flow noise) glslTOP that smears and folds the
   previous frame before re-adding cymatics + aurora. Tune dissipation/feedback gain for a
   "seamless" continuous flow (not a smear that never clears). This is what turns the static
   layers into flowing ink.

3. **Drivers** — wire the flow uniforms:
   - hue ← `audio_out['hue']` / chakra (bowl pitch picks the colour),
   - global pulse/scale ← `heartbeat['beat']` (breathes with the heartbeat),
   - ambient drift ← `absTime.seconds` feeding the flow-noise offset (always moving).

4. **Fingertip orbs** — the orbs must track fingertips, not wrists. Two paths:
   - **Quick proxy (start here):** MediaPipe **Pose** already gives rough index-finger points
     (landmark 19 = left index, 20 = right index). Repoint the particle anchors from wrists
     (15/16) to these in `td/pose_mp_callbacks.py` → 2 fingertip orbs, ~free.
   - **Full (upgrade):** add the bundled `td/models/hand_landmarker.task` as a second
     MediaPipe task in `td/mp_engine.py` → true per-finger tips (up to 10 orbs, e.g. index
     tip = landmark 8 per hand). More work + more cost, but real fingers.
   Recommend shipping the proxy first, then upgrading to hand_landmarker if we want all five.

5. **Orb look (proposed default — "pretty" latitude):** soft additive glowing motes that
   bloom and **trail** from each fingertip (feedback trails), **screen**-blended (consistent
   with the 2026-05-29 bloom fix so they stay coloured, not white), dissolving into the flow.
   They should feel like part of the ink, not separate sprites.

## Open question to confirm at build time
- Fingertips: start with the 2-point Pose proxy, or go straight to `hand_landmarker` for all
  five fingers? (Affects orb count and tracking cost.) — RESOLVED: `hand_landmarker`, all 10 tips.

## As-built updates to the flow / finger interaction

- **2026-06-13** — fingers push/stir/paint the flow directly (the orbs layer is dead/hidden; `flow`
  is the visible aura). `hands_mp` (10 fingertips, `u=1-x`/`v=1-y` to match the `camera_flip` flipx
  display) → `hands_lag` → `hands_vel` (slopeCHOP) feed `flow`'s `uFing0..9` uniforms; the shader
  splats finger **velocity** into the back-advection (`exp(-d²/r²)·force`) and paints dye only while
  moving. Config `uFingerCfg = vec4(radius, force, dye, hue)`.
- **2026-06-16** — finger control retuned for less latency + more grip: `hands_lag` 0.06→0.04,
  `uFingerCfg` radius 0.075→0.10 / force 0.05→0.09 / dye 0.06→0.08, `flow` fade 0.95→0.96. The
  flow also now **reacts to bowl pitch** (`pitch_src`/`pitch_lag`→`uPitch`: higher note = finer/
  faster swirls, energy-gated) and a time-phase **stutter** was fixed by driving flow time from an
  integrated phase (`flow_rate`→`flow_phase` speedCHOP) instead of `absTime*rate`. Full detail:
  `docs/touchdesigner-chladni-implementation-2026-06-09.md` §11.

Related: see `docs/touchdesigner-onesurface-2026-05-27.md` for the standalone architecture and
the separate background-segmentation upgrade (drop the room so the person floats on black).
