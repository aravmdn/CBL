# TouchDesigner in the CBL Installation — Team Explainer
_Last updated 2026-05-28 · for Group 5 teammates_

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

**TouchDesigner runs the whole thing on one laptop and one webcam — no browser.**
It captures the camera, does the body/hand tracking (MediaPipe, running inside TD),
and renders all the GPU visuals for the projector. (Earlier we fed the tracking from
the browser, but that meant a browser tab had to stay open and in focus and it fought
TD for the camera — so TD now does the tracking itself.)

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

**New (working as of 2026-05-28):**
- TD tracks the person's hand (wrist) positions live — originally streamed from the web
  app, now done by TD itself (`td/mp_engine.py`), all offline.
- A **GPU particle system** uses the hands as force fields: hold a hand **still and
  it gathers** particles toward it; **move it fast and it pushes** them away. **The
  particles now render at the hand positions** (the earlier placement bug was found
  and fixed). A test with simulated hands confirmed ~50% of the 2048 particles end
  up at each hand, zero at the center — exactly as intended.
- An **aura that bends and tints around the hands** is built and composited.
- The full picture (camera + cymatics + aurora + particles + hand-warped aura) is
  combined into the final projector image (`master_out`).
- **Open `td/cbl.toe` in TouchDesigner — that's the live build.** The earlier
  simpler grid file is kept locally as `td/cbl.toe.bak` just in case.
- Still pending: trying it with a real person in front of the camera (the build is
  proven correct via simulated data, but the aesthetic feel — gather speed, glow
  intensity, etc. — needs eyeballs).

## Visuals to show
Snapshots of older TD outputs are in **`docs/td-screenshots/`** (predate the particle
render fix). The live project on the dev laptop is the most accurate reference — open
`td/cbl.toe` in TouchDesigner to see it move in real time.

## How it fits the 6-discipline installation
- **Sound/physics** — bowl frequencies → cymatics + chakra color.
- **Biosignals** — heartbeat (Arduino, coming) → aura color + beat pulse.
- **Computer vision** — body/hand tracking drives the particles and aura.
- **Visual art / projection** — TouchDesigner composes it all for the projector.

This is the installation we present on 19 June — TouchDesigner driving the projector
from one laptop, no browser. (The web app is kept only as a simpler fallback.) Full
technical handoff: `docs/touchdesigner-onesurface-2026-05-27.md` (architecture) and
`docs/touchdesigner-handoff-2026-05-26.md` (build journal).
