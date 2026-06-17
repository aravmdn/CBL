# seg_mask scriptTOP — exposes MediaPipe's person segmentation matte as a TOP.
#
# WHY: the body aura (aura_warp) is screen-blended over the whole scene, so it
# washes the person toward white and hides them. Feeding this matte into the aura
# shader lets it DIM where it covers the body, so the user shows through while the
# glow still surrounds them. The matte is already computed every frame by
# mp_engine (PoseLandmarker output_segmentation_masks=True) — we just surface it.
#
# ALIGNMENT (the fiddly bit — see docs/touchdesigner-segmentation-2026-05-29.md):
#   mp_engine is fed np.flipud(resize(camera_in)) = TOP-DOWN, raw (not mirrored),
#   so the mask comes back top-down in raw-camera columns. The display (camera_out)
#   is TD bottom-up AND horizontally mirrored (camera_flip). To line the matte up
#   with camera_out — and with the aura shader's vUV, which uses the same mirror +
#   y-up pose UVs (u=1-x, v=1-y) — apply flipud (TD bottom-up) + fliplr (selfie
#   mirror). copyNumpyArray expects bottom-row-first, which flipud also satisfies.
#   Verify by overlaying seg_mask on camera_out with a person in frame; if it's
#   upside-down/mirrored, toggle the flips below.
import sys

if 'C:/projects/CBL/td' not in sys.path:
    sys.path.append('C:/projects/CBL/td')
import numpy as np
import mp_engine

# Stable fallback resolution (matches the frame submitted to MediaPipe) so the
# TOP doesn't thrash size before the first detection arrives.
_H, _W = 360, 640


def onCook(scriptOp):
    mask = mp_engine.latest()[1]  # (H, W, 1) float32 0..1 person prob, or None
    if mask is None:
        out = np.zeros((_H, _W, 1), dtype=np.float32)  # no person -> aura unchanged
    else:
        # Align to the mirrored, bottom-up display space (see header).
        out = np.ascontiguousarray(np.fliplr(np.flipud(mask)), dtype=np.float32)
    scriptOp.copyNumpyArray(out)
