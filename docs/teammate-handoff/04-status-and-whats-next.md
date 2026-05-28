# Current Status and What's Next

_Snapshot date: 2026-05-28_

A quick, honest picture of where the software is right now.

## What works today

- The **web app** runs and is tested (automated checks all pass).
- **Bowl listening:** the microphone picks up the bowl and shows its strongest notes.
- **Colour detection:** the nearest chakra colour is chosen from the bowl's notes.
- **Cymatics ripples:** drawn from the real bowl frequencies, in the detected colour.
- **Heartbeat aura:** pulses with each beat; colour shifts with heart rate.
- **Body tracking:** finds the person and smoothly places the aura and effects.
- **Polished look:** deep-black background, elegant fonts, controls that fade away so
  the visuals fill the screen.
- **TouchDesigner version:** camera stage, cymatics, aurora ribbons, colour detection,
  a **working live link** that streams the person's hand positions into TouchDesigner,
  **hand-controlled particles** that gather to still hands and scatter from fast ones,
  and a **hand-warped aura** — all composited into one image for the projector. The
  earlier "particles stacked in the centre" bug was found and fixed; a simulated-pose
  test confirmed particles correctly cluster at both hands.

You can see the older visuals in the `screenshots/` folder; the live build on the dev
laptop is the most up-to-date reference.

## In progress

- **Live test with a real person.** The build is proven correct end-to-end with
  simulated hand positions, but it hasn't been tried with someone moving in front of
  the camera yet. That's the next thing — and what's being checked is the
  *aesthetic feel* (does it gather fast enough? does the scatter feel right? is the
  glow strong enough on the projector?), not whether it functions.

## Waiting on hardware

- **Real heartbeat sensor (Arduino pulse sensor).** Not here yet, so the heartbeat is a
  realistic **simulation** for now. Swapping in the real sensor is a small, clearly
  marked change.
- **Better Arduino** and **black display cloth** are being sourced.
- The **Tibetan singing bowl** has been ordered.

## Main risks / open questions

These can only be answered by testing with the **real bowl, mic, camera, and projector**
in the actual room:

- Does the colour detection stay **stable** with the real bowl (not jumping around)?
- Are the visuals **bright and clear enough on a projector**, not just on a laptop?
- Do the hand/body effects appear clearly when the person moves?

## What's next (in order)

1. Test the TouchDesigner build with a real person in front of the camera; tune
   gather/scatter feel and glow intensity if needed.
2. Test with the real bowl and microphone; tune the colour-detection settings if it
   jumps around.
3. When the Arduino arrives, swap the simulated heartbeat for the real sensor.
4. Test the whole thing in the demo room and tune the visual intensity for the
   projector.

## How "done" is checked (for coding teammates)

The web app has automated tests that run with these commands, and all currently pass:

```text
npm run lint      (style/quality check)
npm run test      (unit + component tests)
npm run build     (full build / type check)
npm run test:e2e  (browser end-to-end test)
```
