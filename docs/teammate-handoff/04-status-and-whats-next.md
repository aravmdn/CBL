# Current Status and What's Next

_Snapshot date: 2026-05-26_

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
  and a **working live link** that streams the person's hand positions into
  TouchDesigner.

You can see the current visuals in the `screenshots/` folder.

## In progress

- **Hand-controlled particles (TouchDesigner):** hold a hand still → particles gather;
  move it fast → they scatter. The behaviour is proven correct; one display bug remains
  (particles currently render stacked in the centre instead of at the hands). That's the
  first thing to fix when work resumes.
- After that: an **aura that bends around the hands**, then blending all layers into the
  final projector image.

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

1. Test with the real bowl and microphone; tune the colour-detection settings if it
   jumps around.
2. Fix the TouchDesigner particle display bug so particles appear at the hands.
3. Add the hand-warped aura, then combine all the visual layers for the projector.
4. When the Arduino arrives, swap the simulated heartbeat for the real sensor.
5. Test the whole thing in the demo room and tune the visual intensity.

## How "done" is checked (for coding teammates)

The web app has automated tests that run with these commands, and all currently pass:

```text
npm run lint      (style/quality check)
npm run test      (unit + component tests)
npm run build     (full build / type check)
npm run test:e2e  (browser end-to-end test)
```
