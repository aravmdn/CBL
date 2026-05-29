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
