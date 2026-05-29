# hands_mp scriptCHOP — in-TD MediaPipe HAND tips -> 30 channels for a
# per-fingertip orb/particle system (5 tips per hand, up to 2 hands).
# Reads the latest async result from mp_engine; does NOT submit frames itself
# (pose_mp already submits every cook, and one submit feeds both detectors).
# Coords match the pose pipeline: u = 1 - x (selfie mirror), v = 1 - y (y-up).
import sys
import math

if 'C:/projects/CBL/td' not in sys.path:
    sys.path.append('C:/projects/CBL/td')
import numpy as np
import cv2
import mp_engine

CBL = op('/project1/cbl')

# MediaPipe 21-point hand model — the 5 fingertip landmark indices.
TIP_IDX = (4, 8, 12, 16, 20)  # thumb, index, middle, ring, pinky

# Output slots: f0-f4 = LEFT hand tips, f5-f9 = RIGHT hand tips (by label, so
# orbs stay assigned to the correct hand even when hands cross on screen).
SLOTS = tuple('f%d' % i for i in range(10))


def onCook(scriptOp):
    scriptOp.clear()
    t = absTime.seconds

    # Read the most recent async hand result. pose_mp owns submit().
    hands, _ts = mp_engine.latest_hands()

    # Bucket detected hands by handedness label. If two hands report the same
    # label (rare jitter), the higher-score one wins its slot group.
    by_label = {'Left': None, 'Right': None}
    if hands:
        for h in hands:
            label = h.get('handedness')
            if label not in by_label:
                continue
            prev = by_label[label]
            if prev is None or h.get('score', 0.0) > prev.get('score', 0.0):
                by_label[label] = h

    st = CBL.fetch('hands_mp_state', {})
    dt = t - st.get('_t', t - 1.0 / 60.0)
    if dt <= 0.0:
        dt = 1.0 / 60.0
    alpha = 1.0 - math.exp(-dt / 0.08)  # ~80ms low-pass (matches pose_mp)

    # Build target (u, v, c) per slot from the detected fingertips.
    targets = {}
    for group, label in ((0, 'Left'), (5, 'Right')):
        hand = by_label[label]
        if hand is None:
            continue
        lm = hand.get('lm') or []
        score = hand.get('score', 0.0)
        for j, tip in enumerate(TIP_IDX):
            if tip >= len(lm):
                continue
            x, y = lm[tip]
            targets['f%d' % (group + j)] = (1 - x, 1 - y, score)

    # EMA-smooth each slot, holding last position with _c=0 when absent.
    rows = []
    for slot in SLOTS:
        tgt = targets.get(slot)
        pu = st.get(slot + '_u', 0.5)
        pv = st.get(slot + '_v', 0.5)
        if tgt is not None:
            u, v, c = tgt
            su = pu + (u - pu) * alpha
            sv = pv + (v - pv) * alpha
        else:
            su, sv, c = pu, pv, 0.0  # hold last position, zero confidence
        rows.append((slot, su, sv, c))
        st[slot + '_u'] = su
        st[slot + '_v'] = sv
    st['_t'] = t
    CBL.store('hands_mp_state', st)

    def emit(name, val):
        scriptOp.appendChan(name).vals = [float(val)]

    for slot, su, sv, c in rows:
        emit(slot + '_u', su)
        emit(slot + '_v', sv)
        emit(slot + '_c', c)
