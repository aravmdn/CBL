# TouchDesigner — Background Segmentation Spec (next visual upgrade)

_Written 2026-05-29. NOT built yet — this is the spec for the next TD session. Needs TD
open on MCP :44444 + a person in frame (alignment must be eyeballed)._

## Goal

Drop the room so only the **person** shows, floating on the black `void`. This removes the
bright slanted-ceiling "wedge" in the top-left of the camera and makes the person pop, while
the flowing colour + fingertip orbs still composite on top.

## What already exists (most of the work is done)

- `td/mp_engine.py` already creates the PoseLandmarker with `output_segmentation_masks=True`,
  and `_on_result` already stores the person mask: `latest()` returns `(landmarks, mask, ts)`
  where `mask` is a float32 HxW ndarray (≈0..1 person probability) at the submitted frame size
  (currently 640×360 — see `pose_mp_callbacks.py`).
- A dedicated, cleaner model `td/models/selfie_segmenter.task` is also bundled if the pose mask
  is too rough (see "Option B").
- Composite chain today: `camera_in → camera_flip → camera_level → camera_out`, then
  `comp_cam = camera_out OVER void`. The flow + orbs are layered above `comp_cam`.

## Build steps

1. **Mask → TOP.** Add a `seg_mask` scriptTOP whose `onCook` reads `mp_engine.latest()[1]` and
   writes it out (single channel) via `scriptOp.copyNumpyArray(...)`. Blur it slightly for a
   clean matte edge.
2. **Alignment (the fiddly bit — verify live).** The mask is aligned to the frame fed to
   MediaPipe = `np.flipud(resize(camera_in))` (top-down, raw — NOT mirrored). `camera_out` is
   bottom-up (TD) and horizontally mirrored (`camera_flip`). So when copying the mask to the TOP,
   apply **`flipud`** (for TD's bottom-up origin) **and `fliplr`** (to match the selfie mirror) so
   `seg_mask` lines up with `camera_out`. Confirm by overlaying — small flip mistakes are the most
   likely bug here, which is why this needs a person in frame.
3. **Key the camera over void.** Multiply `camera_out` by `seg_mask` (RGB and/or alpha), then make
   `comp_cam = (masked camera) OVER void`. Person pixels stay; room → black. Everything downstream
   (flow, orbs) is unchanged.

## Option B — cleaner matte (if the pose mask is too rough)

Add an `ImageSegmenter` (MediaPipe Tasks) in `td/mp_engine.py` loading
`td/models/selfie_segmenter.task` (LIVE_STREAM), fed from the same `submit()` call (same pattern
as the hand detector was added), with a `latest_segmentation()` accessor. Use its category mask
in step 1 instead of the pose mask. Higher quality, slightly more cost.

## Risks / notes
- Edge quality: pose mask is serviceable but soft; selfie_segmenter is crisper. Blur + a small
  threshold/feather makes either look intentional rather than noisy.
- Performance: copying a 640×360 mask per frame is cheap; fine on the demo laptop.
- Keep it reversible: leave the un-masked `camera_out`/`comp_cam` path intact (bypassable) until
  the matte is verified, same discipline as the retired pose bridge.

Related: `docs/touchdesigner-onesurface-2026-05-27.md` (architecture),
`docs/touchdesigner-visual-redesign-2026-05-29.md` (the flow + orbs already built).
