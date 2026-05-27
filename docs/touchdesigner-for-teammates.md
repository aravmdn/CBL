# TouchDesigner in the CBL Installation — Team Explainer
_2026-05-26 · for Group 5 teammates_

## What TouchDesigner is
TouchDesigner ("TD") is a professional **node-based, real-time visuals tool** used
for live concerts, museum installations, and projection art. Instead of writing
code line-by-line, you wire together **operators** (nodes) that pass images, audio,
and data to each other — and it all runs live on the GPU at 60 fps. It's the kind
of tool VJs and installation artists use to drive projectors.

## Why we use it for the bowl installation
Our concept: the **Tibetan singing bowl calms the person → their heartbeat slows →
that drives living visuals** projected around them. TD is a great fit because:
- It renders on the **GPU**, so it stays smooth on a projector at full screen.
- It natively handles our three inputs: the **bowl microphone** (sound), the
  **webcam** (the person), and later the **Arduino pulse sensor** (heartbeat).
- It turns those signals directly into light: cymatics patterns, aurora ribbons,
  particles, and an aura around the body.

There are two pieces running together:
1. **The web app** (browser) — does the camera + body/hand tracking (MediaPipe).
2. **TouchDesigner** — receives that tracking data and does the heavy GPU visuals
   for the projector.

## How it's being built
The TD network is built **AI-assisted** through Claude Code: I describe the visual
in plain language and it constructs/edits the live TD node network for me. This
lets us iterate on the look quickly without hand-placing every node.

## What's working so far
Open in TouchDesigner right now (network `/project1/cbl`):

- **Camera stage** — webcam, mirrored selfie view, darkened to a deep-void look.
- **Cymatics** — a `sin(kx)·sin(ky)` interference pattern (ported from a teammate's
  MATLAB Chladni-plate code) that reacts to the bowl's frequencies and is colored
  by the detected **chakra** (the 396–963 Hz Solfeggio scale).
- **Aurora ribbons** — four flowing light curtains, tinted by the heartbeat (BPM)
  and pulsing on each beat.
- **Bowl-audio chakra detection** — the bowl spectrum is matched to the nearest
  Solfeggio note → sets the color theme.
- **Simulated heartbeat** — a 70-BPM stand-in pulse until the Arduino arrives.

**New this week — hands controlling the visuals:**
- The web app now **streams the person's hand (wrist) positions into TD live** over
  a local connection.
- A **GPU particle system** uses the hands as force fields: hold a hand **still and
  it gathers** particles toward it; **move it fast and it pushes** them away. The
  underlying physics is built and confirmed working (particles correctly cluster to
  the hands). The final on-screen placement of the particle layer is being polished.
- Next: an **aura that bends/bulges around the hands**, then blending the particle
  and aura layers into the final projector image.

## Visuals to show
Snapshots of the current TD outputs are in **`docs/td-screenshots/`**:
- `master_out.png` — the combined stage (camera + cymatics + aurora).
- `cymatics.png`, `aurora.png` — the individual reactive layers.
- `p_render.png` — the new particle layer (placement still being tuned).

The live project is also open in TouchDesigner on the dev laptop — you can see it
move in real time there.

## How it fits the 6-discipline installation
- **Sound/physics** — bowl frequencies → cymatics + chakra color.
- **Biosignals** — heartbeat (Arduino, coming) → aura color + beat pulse.
- **Computer vision** — body/hand tracking drives the particles and aura.
- **Visual art / projection** — TouchDesigner composes it all for the projector.

This is the GPU/projector path; the web app remains the simpler laptop-only
fallback for the demo. Full technical handoff (for resuming the build) lives in
`docs/touchdesigner-handoff-2026-05-26.md`.
