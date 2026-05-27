# What Arav Is Building

_Snapshot date: 2026-05-26_

This is the part teammates most often ask about. Arav is the **computer-science /
signal-processing lead**. In plain terms, Arav builds **the software that listens,
watches, and draws** — it takes the bowl sound, the heartbeat, and the camera, and
turns them into the live visuals.

## Arav's job in one line

> Take the real signals (bowl sound, heartbeat, person's body) and turn them into the
> moving, colourful visuals that are the artwork.

## The three signals and what each one controls

| Signal | Where it comes from | What it does to the screen |
|---|---|---|
| **Bowl sound** | A microphone listening to the bowl | Sets the **colour** and the **rippling pattern**. The software finds the bowl's strongest notes, matches them to the nearest "chakra" colour, and draws a ripple pattern from them. |
| **Heartbeat** | A pulse sensor (Arduino) — *hardware still arriving; for now it's simulated* | Sets the **pulse** and the **aura colour**. The visuals throb on each beat. Slow beat = calm violet/cyan; fast beat = amber/orange. |
| **The person's body** | The webcam + body-tracking | **Places** everything around the person — the aura wraps the body, effects follow the hands, etc. |

## Two versions of the software (this is important)

Arav is building the visuals **two ways**, on purpose:

### 1. The web app (the safe, simple version)
A program that runs in a normal web browser on the laptop. It does the camera, the
body tracking, the bowl-sound colour, the cymatics ripples, the heartbeat aura, and
glowing particles — all by itself. **This is the reliable fallback for the demo:** it
needs only the laptop, and it works even if the fancier setup fails.

### 2. The TouchDesigner version (the high-end, projector version)
**TouchDesigner** is professional software that artists use to make live visuals for
concerts and museums. It runs on the graphics card, so it stays smooth and looks great
on a big projector. In this setup, the web app handles the camera/body tracking and
**streams the body position into TouchDesigner**, which does the heavy, beautiful
visuals for the projector.

> Simple way to say it: *"The web app is the safe version that runs on the laptop. The
> TouchDesigner version is the prettier one for the projector — they share the same
> idea."*

A nice detail: the TouchDesigner visuals are built **AI-assisted** — Arav describes the
visual in plain language and an AI tool builds and edits the node network inside
TouchDesigner. This lets the look be iterated quickly.

## What's done, what's in progress, what's waiting

### Done and working
- Live bowl-microphone listening with a frequency display.
- Finds the bowl's strongest notes and the nearest **chakra colour**.
- **Cymatics** ripple pattern driven by the real bowl frequencies (translated from a
  teammate's MATLAB code — see `matlab-reference/`).
- A heartbeat **aura** that pulses with each beat and changes colour with heart rate.
- **Body tracking** so the aura and effects follow the person; movement is smoothed so
  it glides instead of jumping.
- A dark, polished look (deep-black background, elegant typography, controls that fade
  away after a few seconds so the visuals fill the screen).
- In the TouchDesigner version: camera stage, cymatics, aurora ribbons, chakra colour
  detection, and a **live link that streams the person's hand positions into
  TouchDesigner**.

### In progress
- A **hand-controlled particle system** in TouchDesigner: hold a hand still and
  particles gather to it; move it fast and they scatter. The physics is proven correct;
  one display bug is being fixed (the particles currently draw stacked in the centre
  instead of at the hands).
- After that: an **aura that bends around the hands**, then blending all the layers
  into the final projector image.

### Waiting on hardware
- The **real heartbeat sensor** (Arduino pulse sensor). Until it arrives, the heartbeat
  is a realistic **simulation**. Swapping in the real sensor is a small, well-marked
  change.
- **Real-room testing** with the actual bowl, microphone, camera, and projector, to
  tune how strong and stable the effects look.

## Where teammates' work plugs into Arav's part

- **Alice's bowl-frequency experiments** → tell Arav which frequency ranges the real
  bowl produces, so the colour detection can be tuned.
- **The MATLAB sound analysis** (a teammate's original work) → its logic was translated
  into the web app for the bowl colour + ripple pattern. Originals are in
  `matlab-reference/`.
- **The report writers** → the overview and "how it fits" docs here give the material
  to explain the artwork's technical side in simple terms.
