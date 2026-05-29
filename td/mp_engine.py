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
HAND_MODEL = os.path.join(_HERE, "models", "hand_landmarker.task")

# Latest result, published by the async callback and read on TD's main thread.
# Python reference assignment is atomic, so readers always see a complete tuple.
_state = {"landmarks": None, "mask": None, "ts": 0.0, "frames": 0}
_landmarker = None
_last_ts_ms = 0

# Latest hand result, published by the async hand callback. Same atomic-assignment
# discipline as _state: each field is replaced wholesale, never mutated in place,
# so a reader on the main thread always sees a self-consistent snapshot.
# 'hands' is a list (one entry per detected hand); see _on_hands for the shape.
_hand_state = {"hands": [], "ts": 0.0, "frames": 0}
_hand_landmarker = None


def _on_result(result, output_image, timestamp_ms):
    lm = result.pose_landmarks[0] if result.pose_landmarks else None
    mask = result.segmentation_masks[0].numpy_view() if result.segmentation_masks else None
    _state["landmarks"] = [(p.x, p.y, p.visibility) for p in lm] if lm else None
    _state["mask"] = None if mask is None else np.ascontiguousarray(mask, dtype=np.float32)
    _state["ts"] = time.time()
    _state["frames"] += 1


def _on_hands(result, output_image, timestamp_ms):
    """Async callback for the HandLandmarker. Builds one dict per detected hand.

    Each entry: {'handedness': 'Left'|'Right', 'score': float,
                 'lm': [(x, y) for each of the 21 hand landmarks]}.
    Handedness/landmark lists from MediaPipe are index-aligned (hand i in
    result.handedness matches hand i in result.hand_landmarks).
    """
    hands = []
    if result.hand_landmarks:
        for i, lm in enumerate(result.hand_landmarks):
            cat = result.handedness[i][0]  # top handedness category for this hand
            hands.append({
                "handedness": cat.category_name,
                "score": float(cat.score),
                "lm": [(p.x, p.y) for p in lm],
            })
    _hand_state["hands"] = hands
    _hand_state["ts"] = time.time()
    _hand_state["frames"] += 1


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


def get_hand_landmarker():
    global _hand_landmarker
    if _hand_landmarker is None:
        opts = vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL),
            running_mode=vision.RunningMode.LIVE_STREAM,
            num_hands=2,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            result_callback=_on_hands,
        )
        _hand_landmarker = vision.HandLandmarker.create_from_options(opts)
    return _hand_landmarker


def submit(rgb_uint8):
    """Feed one top-down, contiguous HxWx3 uint8 RGB frame for async detection.

    One submit feeds BOTH the pose and hand detectors with the SAME monotonic
    timestamp, so callers never need to submit twice. The two detectors are
    independent landmarker instances publishing to separate state dicts.
    """
    global _last_ts_ms
    ts = int(time.time() * 1000)
    if ts <= _last_ts_ms:
        ts = _last_ts_ms + 1
    _last_ts_ms = ts
    img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_uint8)
    get_landmarker().detect_async(img, ts)
    # Feed the hand detector too. Guarded so a missing/broken hand model never
    # breaks pose detection (mirrors the module's offline robustness).
    try:
        get_hand_landmarker().detect_async(img, ts)
    except Exception:
        pass


def latest():
    """(landmarks | None, mask ndarray | None, wall-clock ts) of the newest result."""
    return _state["landmarks"], _state["mask"], _state["ts"]


def latest_hands():
    """(hands, wall-clock ts) of the newest hand result.

    `hands` is a list with one dict per detected hand (empty list if none):
        {'handedness': 'Left'|'Right', 'score': float, 'lm': [(x, y) x21]}.
    """
    return _hand_state["hands"], _hand_state["ts"]


def frames_processed():
    return _state["frames"]


def reset():
    """Release both landmarkers (e.g. before re-creating with new options)."""
    global _landmarker, _hand_landmarker, _last_ts_ms
    if _landmarker is not None:
        try:
            _landmarker.close()
        except Exception:
            pass
    _landmarker = None
    if _hand_landmarker is not None:
        try:
            _hand_landmarker.close()
        except Exception:
            pass
    _hand_landmarker = None
    _last_ts_ms = 0
    _state.update({"landmarks": None, "mask": None, "ts": 0.0, "frames": 0})
    _hand_state.update({"hands": [], "ts": 0.0, "frames": 0})
