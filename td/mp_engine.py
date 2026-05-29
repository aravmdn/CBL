"""CBL — in-TouchDesigner MediaPipe engine (single-camera, no browser).

Runs MediaPipe PoseLandmarker in LIVE_STREAM (async) mode so detection never
blocks TD's render thread. TD feeds camera frames via `submit()` and reads the
most recent result via `latest()` each cook.

Why this exists: the demo must be ONE surface (TouchDesigner) on ONE webcam,
doing live video + body/hand detection + effects together. The browser pose
bridge is retired. See docs/touchdesigner-onesurface-2026-05-27.md.

Models are bundled under td/models/ for offline use (no internet at the demo).
"""

import os
import sys
import threading
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
_PYLIBS = os.path.join(_HERE, "pylibs")
if _PYLIBS not in sys.path:
    sys.path.append(_PYLIBS)  # append: TD's own numpy/cv2 keep priority

import numpy as np  # noqa: E402
import mediapipe as mp  # noqa: E402
from mediapipe.tasks import python as mp_python  # noqa: E402
from mediapipe.tasks.python import vision  # noqa: E402

POSE_MODEL = os.path.join(_HERE, "models", "pose_landmarker_full.task")

# Latest result, published by the async callback and read on TD's main thread.
# Python reference assignment is atomic, so readers always see a complete tuple.
_state = {"landmarks": None, "mask": None, "ts": 0.0, "frames": 0}
_landmarker = None
_last_ts_ms = 0


def _on_result(result, output_image, timestamp_ms):
    lm = result.pose_landmarks[0] if result.pose_landmarks else None
    mask = result.segmentation_masks[0].numpy_view() if result.segmentation_masks else None
    _state["landmarks"] = [(p.x, p.y, p.visibility) for p in lm] if lm else None
    _state["mask"] = None if mask is None else np.ascontiguousarray(mask, dtype=np.float32)
    _state["ts"] = time.time()
    _state["frames"] += 1


def get_landmarker():
    global _landmarker
    if _landmarker is None:
        opts = vision.PoseLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=POSE_MODEL),
            running_mode=vision.RunningMode.LIVE_STREAM,
            output_segmentation_masks=True,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            result_callback=_on_result,
        )
        _landmarker = vision.PoseLandmarker.create_from_options(opts)
    return _landmarker


def submit(rgb_uint8):
    """Feed one top-down, contiguous HxWx3 uint8 RGB frame for async detection."""
    global _last_ts_ms
    ts = int(time.time() * 1000)
    if ts <= _last_ts_ms:
        ts = _last_ts_ms + 1
    _last_ts_ms = ts
    img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_uint8)
    get_landmarker().detect_async(img, ts)


def latest():
    """(landmarks | None, mask ndarray | None, wall-clock ts) of the newest result."""
    return _state["landmarks"], _state["mask"], _state["ts"]


def frames_processed():
    return _state["frames"]


def reset():
    """Release the landmarker (e.g. before re-creating with new options)."""
    global _landmarker, _last_ts_ms
    if _landmarker is not None:
        try:
            _landmarker.close()
        except Exception:
            pass
    _landmarker = None
    _last_ts_ms = 0
    _state.update({"landmarks": None, "mask": None, "ts": 0.0, "frames": 0})
