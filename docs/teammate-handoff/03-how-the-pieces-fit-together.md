# How The Pieces Fit Together

_Snapshot date: 2026-05-26_

This explains how the bowl, heartbeat, camera, and visuals connect. It's the technical
backbone in plain language — useful for the report's "how it works" section.

## The big flow

```text
  THE BOWL  ───────►  microphone  ──►  find strongest notes  ──►  nearest chakra colour ┐
                                                                                         │
  THE PERSON ──────►  webcam  ──►  body tracking  ──►  where the body/hands are ─────────┤──►  LIVE VISUALS
                                                                                         │      on screen /
  THE HEARTBEAT ───►  pulse sensor*  ──►  beats per minute (BPM)  ──►  pulse + aura colour┘      projector
```

\*The pulse sensor (Arduino) is still arriving; for now the heartbeat is simulated.

## What each input becomes on screen

- **Bowl sound → colour + ripple.** The microphone hears the bowl. The software looks
  at which notes (frequencies) are strongest, matches the closest one to a **chakra
  colour** (a colour scale from 396–963 Hz), and draws a **cymatics** ripple pattern
  (think of sand patterns on a vibrating plate) in that colour.
- **Heartbeat → pulse + aura colour.** Each beat makes the visuals throb briefly. The
  heart rate sets the aura's colour: slow/calm leans violet and cyan; faster leans
  amber and orange.
- **Body → placement.** The camera and body-tracking find the head, shoulders, wrists,
  and torso, so the aura wraps the body and effects can follow the hands. The tracking
  is **smoothed** so things glide instead of snapping around.

## The two software paths (same idea, two engines)

```text
                         ┌─────────────────────────────────────────┐
        camera + body ──►│  WEB APP  (runs in the browser/laptop)   │──► laptop screen
                         │  · camera + body tracking                │     (safe fallback)
                         │  · bowl colour + cymatics                │
                         │  · heartbeat aura + particles            │
                         └───────────────┬─────────────────────────┘
                                         │  streams body/hand positions
                                         ▼
                         ┌─────────────────────────────────────────┐
                         │  TOUCHDESIGNER  (runs on the GPU)        │──► projector
                         │  · heavy, smooth, projector-quality      │     (high-end show)
                         │    visuals: cymatics, aurora, particles  │
                         └─────────────────────────────────────────┘
```

- **Web app** — the dependable version. Everything runs on the laptop in a browser.
  Best for "it just works" on demo day.
- **TouchDesigner** — the premium version for the projector. The web app feeds it the
  body/hand positions; TouchDesigner draws the big, smooth visuals. The link between
  them is a small local connection on the same laptop (nothing goes to the internet).

## How the MATLAB work relates

A teammate originally prototyped the **sound analysis in MATLAB** — listening to the
bowl, finding the strongest frequencies, building a cymatics pattern, and mapping notes
to chakra colours. That logic was **translated into the web app's code** (not run
directly). So the science is still there — the real bowl sound genuinely drives the
pattern and colour — but it's presented as polished art rather than a plain graph. The
original MATLAB files are in `matlab-reference/`.

> Simple way to say it: *"The MATLAB part figured out how to read the bowl. The web app
> uses that same idea to drive the visuals."*

## Privacy (good for the report)

Everything stays **on the laptop**. The camera picture and the microphone sound are
used locally to make the visuals and are **not sent anywhere** — no servers, no
internet, no recording uploaded. This also means the installation can run fully
**offline**, which it must on presentation day.
