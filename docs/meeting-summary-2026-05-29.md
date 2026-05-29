# What we got done — TouchDesigner session (29 May 2026)

_A plain-language summary for the Group 5 meeting. No code knowledge needed._

## The one-line version

The whole installation now runs **inside TouchDesigner alone, on one laptop with one
webcam, and the visuals were redesigned into a flowing "ink in water" look with glowing
orbs on your fingertips.** No web browser is involved in the demo anymore.

---

## 1. TouchDesigner is now the real thing (not the website)

Before, we had two separate things: a **website** (in the browser) that did the camera +
body tracking, and **TouchDesigner** that did the pretty effects. They had to talk to each
other, and the browser had to stay open the whole time.

When we tested that live, two things broke:
- TouchDesigner showed a **frozen picture of you** — because the browser had grabbed the
  webcam first, so TouchDesigner couldn't get a live feed.
- The **browser tab had to stay open and in focus**, or the effects froze. (Browsers
  quietly pause tabs you click away from.)

**The fix:** we moved everything into TouchDesigner. It now runs the camera, the body
tracking, AND the hand tracking by itself. **No browser at the demo.** This removes both
problems in one move — TouchDesigner owns the camera, so nothing fights it for it.

> For the meeting: "The demo is now one program on one laptop. You stand in front of the
> webcam and it just works — nothing else needs to be open."

## 2. We recovered work that had been lost

A previous session had built the "TouchDesigner does its own body tracking" part, but it
was **never saved into our shared project**, so it looked like it didn't exist and none of
our notes mentioned it. This session we **found it, saved it properly, and documented it**,
so it can't get lost again.

## 3. New look: flowing colour instead of a dotted grid

The old visual was a **grid of dots** (a physics pattern from the singing bowl). The new
look keeps the bowl physics but renders it as **smooth, flowing colour — like ink dropped
in water** that swirls and folds into itself. It is calm and continuous, with no hard edges.

The colour is driven by three things at once:
- **The bowl's pitch** picks the colour (each note maps to a chakra colour).
- **The heartbeat** makes the whole image gently pulse/breathe.
- A slow **ambient drift** keeps it always gently moving on its own.

## 4. Glowing orbs on all ten fingertips

We added soft glowing **orbs that sit on each of your ten fingertips** and leave trails
that dissolve into the flowing colour. As you move your hands, the orbs paint into the ink.
This uses real hand tracking (it finds all 21 points of each hand and lights up the tips).

Tested live: it correctly found all 10 fingertips with high confidence while moving around.

## 5. What's the same / what's still coming

**Still works exactly as before:** the singing bowl → colour mapping, the simulated
heartbeat pulse, the body aura.

**Left for next time (on purpose, fully written up so it's quick to do):**
- **Drop the background** so only the *person* shows, floating on black. Right now the
  camera shows the whole room (you can see the ceiling). The tool that detects "where the
  person is" already exists in our system — we just need to switch it on next session.
- **Real heartbeat from the Arduino pulse sensor** (currently a realistic simulated beat).
- **Tuning the bowl detection** with the actual physical bowl once Alice has it.

---

## What this means for the team

- **The demo is simpler and more reliable now** — one laptop, one webcam, one program.
- **It looks much better** — flowing colour + fingertip orbs instead of a dot grid.
- All six disciplines still have a visible role: bowl frequencies pick the colours, the
  heartbeat drives the pulse, the camera/body/hand tracking drives the motion.
- Everything is saved and backed up online, so anyone can pull the latest.

_Technical details, if anyone wants them, live in `docs/touchdesigner-onesurface-2026-05-27.md`
(the architecture) and `docs/touchdesigner-visual-redesign-2026-05-29.md` (the new look)._

---

# Part 2 — Your teammates' work is now in the project (29 May 2026, later session)

_This part is all about what the rest of the group sent in, and what we did with it.
Lots of discussion points here — these are the things to raise with each person._

## The one-line version

The **heartbeat sensor work** and the **TouchDesigner experiments** the team sent over
were reviewed and folded into the project. The biggest result: **the real heartbeat sensor
is now wired into the live installation** (it just needs the physical device to test). All
of the teammate files were also tidied into the project so nothing gets lost.

---

## 6. The heartbeat sensor — now plugged into the visuals 🫀  ⭐ biggest win

**What the teammate built:** two versions of the pulse-sensor program (Arduino) plus a
little desktop "heart graph" viewer. One version streams your heartbeat live; the other
measures for 10 seconds and averages it for a steadier number. Solid, working sensor code.

**What we did with it:** we connected that heartbeat into TouchDesigner. Until now the whole
installation pulsed to a *simulated* heartbeat (a fake ~70 bpm). Now the visuals are wired to
pulse at **your actual measured heart rate** — the aura, the flowing colour, and the
fingertip orbs will all breathe in time with the real beat. We also combined the teammate's
two programs into **one improved version** that takes the best of both (detects your finger,
smooths the number, and streams it continuously without freezing).

Right now it safely falls back to the simulated 70 bpm whenever no sensor is plugged in, so
nothing breaks. The only thing left is to **plug in the real sensor and test it together.**

> **Discuss with the heartbeat teammate:**
> - "Your sensor code is now driving the live visuals — great work, it dropped straight in."
> - **Bring the physical sensor** to the next session so we can test it on the real install.
> - We made a design decision: **one hand rests a finger on the sensor, the other hand stays
>   free for the camera** (you can't raise both hands *and* keep a finger on the sensor).
> - I merged your two sketches into one — happy to walk you through what changed.

## 7. Henk's TouchDesigner experiments — exactly the right direction 🎛️

**What Henk built:** two small TouchDesigner projects from online tutorials — a soft,
"fluffy" flowing-texture effect, and a glowing ball that follows the mouse.

**Why this matters:** these are *precisely* the two skills the installation is built on —
(1) **flowing feedback textures** (that's literally our "ink in water" look) and (2) **moving
something on screen by tracking a position** (that's how our fingertip orbs follow your
hands). Henk is learning the exact right building blocks.

The project already contains bigger versions of both effects, so his files don't need to be
*added* — but they mean **Henk is ready to own a piece of the TouchDesigner build himself**,
which spreads the work out instead of it all sitting with one person.

> **Discuss with Henk:**
> - "Your 'fluff' experiment is the same idea as our flowing-colour layer, and your
>   mouse-ball is the same idea as our fingertip orbs — you're learning exactly the right things."
> - **Offer:** would he want to own the **flowing-colour ("ink") layer**? It's his fluff
>   experiment, scaled up — a natural fit.

## 8. The MATLAB sound work — confirmed it's the basis of our colours 🧮

**What the teammate built:** the MATLAB sound-analysis code (live microphone → frequency
breakdown → the bowl-pattern image → chakra colour). 

**What we did:** double-checked it against what's running live, and confirmed our visuals use
**exactly** that teammate's logic — the same pattern formula and the same 7-colour chakra
table (Root → Crown, 396–963 Hz). So this teammate's work is already fully represented in the
demo; nothing more is needed unless we **re-tune the colours with the real physical bowl.**

> **Discuss with the bowl/sound teammate:**
> - "Your MATLAB colour mapping is already what the live demo uses — it's in."
> - Once Alice has the real bowl, we sit together and **tune the colour thresholds** to it.

## 9. The design-principles research — for the report & slides 📊

**What the teammate built:** a researched write-up on what makes presentations clear and
memorable (visual hierarchy, cutting clutter, using animation only when it explains
something, plus an AI-assisted slide workflow).

This is great material for the **group report and the final presentation deck** — it gives us
a ready structure ("one slide, one job", and a build order: idea → system → challenge →
evidence → plan → risks → close).

> **Discuss with the report team (Alice / Joris / Henk):** use this as the backbone for the
> deck. It's saved at `docs/engineering-art-design-ai-research.md`.

## 10. Tidied everyone's files into the project 🗂️

So nothing gets lost, all the teammate files were sorted into the shared project:
- Heartbeat sensor code → `td/arduino/reference/` (with the merged version to flash in `td/arduino/heartbeat_stream/`).
- MATLAB sound code → `EngineeringArt CBL/`.
- Design research → `docs/`.
- The big handoff zips, screenshots and photos are kept on the laptop but left out of the
  shared code (they don't belong in the codebase). Everything is backed up online.

---

## Quick recap for the whole group

| Teammate work | Status now |
|---|---|
| Heartbeat sensor (Arduino) | **Wired into the live visuals** — needs the physical sensor to test |
| Henk's TouchDesigner experiments | Right techniques learned — Henk can own a layer next |
| MATLAB sound → colour | Already powering the live colours — confirmed |
| Design-principles research | Ready to drive the report & slide deck |

**Two things we need from the group:** (1) bring the **physical heartbeat sensor** to test,
and (2) bring the **real singing bowl** so we can tune the colours to it.
