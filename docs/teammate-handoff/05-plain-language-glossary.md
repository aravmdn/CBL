# Plain-Language Glossary

_Snapshot date: 2026-05-26_

Every technical word in this pack, explained in one or two plain sentences. Hand these
to a teammate whenever a term comes up.

## The concept words

- **Tibetan singing bowl** — A metal bowl that makes a long, calming tone when struck or
  rubbed. The sound source of the whole installation.
- **Chakra colours** — A colour scale used in the artwork, where certain sound
  frequencies (about 396–963 Hz, the "Solfeggio" notes) each map to a colour (e.g. red,
  orange, gold, green, blue, violet). The bowl's note picks the colour on screen.
- **Solfeggio frequencies** — The specific set of tones (396, 417, 528, 639, 741, 852,
  963 Hz) used for the chakra colour mapping.
- **Aura** — The soft glowing halo drawn around the person on screen. Its colour follows
  the heartbeat; it pulses on each beat.
- **Cymatics** — Patterns that sound makes in a physical material (like sand on a
  vibrating plate). Here it's a rippling on-screen pattern generated from the bowl's
  frequencies. Sometimes called a **Chladni** pattern.
- **Aurora ribbons** — Flowing curtains of light on screen (like the northern lights),
  used as a background visual layer that reacts to the heartbeat.

## The signal words

- **Frequency** — How high or low a sound is, measured in **Hz** (hertz). The bowl
  produces several frequencies at once; the strongest ones drive the colour.
- **FFT (Fast Fourier Transform)** — A standard maths method that takes a sound and
  finds which frequencies are in it. It's how the software "hears" which notes the bowl
  is making.
- **Frequency peaks** — The strongest few frequencies the FFT finds — the bowl's main
  notes at that moment.
- **BPM (beats per minute)** — Heart rate. Lower = calmer. Drives the aura colour and
  pulse.
- **HRV (heart-rate variability)** — The tiny natural changes in time between heartbeats.
  Adds lifelike variation to the simulated heartbeat.

## The camera / tracking words

- **Webcam / camera feed** — The live video of the person, shown mirrored (like a selfie)
  and darkened for the look.
- **Body tracking / pose tracking** — Software that finds body points (head, shoulders,
  wrists, torso) in the camera image so effects can be placed on the person.
- **MediaPipe** — The specific, free Google tool used for body/pose tracking.
- **Anchors / landmarks** — The tracked body points (head, wrists, etc.).
- **Smoothing (OneEuroFilter)** — A technique that removes jitter from the tracking so
  the aura glides smoothly instead of snapping around.

## The software / engine words

- **Web app** — The version of the visuals that runs in a normal web browser on the
  laptop. The reliable fallback for the demo. Built with React/Vite (web technologies).
- **TouchDesigner ("TD")** — Professional node-based software for live visuals, used in
  concerts and museums. Runs on the graphics card (GPU) for smooth, projector-quality
  output. The high-end version of the visuals.
- **GPU** — The graphics chip in a computer. Doing visuals on the GPU keeps them fast and
  smooth, even full-screen on a projector.
- **GLSL** — A small programming language for writing visual effects that run on the GPU.
  Used inside TouchDesigner for the particle and aura effects.
- **Particle system** — Many tiny dots of light moving together as one effect. Here the
  person's hands attract or scatter them.
- **Node network / operators** — In TouchDesigner you build visuals by wiring together
  boxes ("operators" or "nodes") instead of writing code line by line.
- **The bridge / WebSocket** — The small local connection that sends the person's
  hand/body positions from the web app into TouchDesigner. Local only — nothing leaves
  the laptop.
- **MCP / Claude Code** — The AI-assisted setup Arav uses: he describes a visual in plain
  language and an AI tool builds or edits the TouchDesigner network for him.
- **MATLAB** — The maths/engineering software a teammate used to first prototype the bowl
  sound analysis. That logic was translated into the web app; the originals are in
  `matlab-reference/`.
- **Arduino** — A small hobby electronics board. It will read the pulse sensor and send
  the real heartbeat to the software (still arriving).

## Project / process words

- **CBL** — Challenge-Based Learning, the TU/e course format this project is for.
- **Dormant / legacy code** — Old code (the dropped "poetry" feature) still sitting in
  the project but **not used**. Ignore it when explaining the current project.
