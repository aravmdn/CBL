# pose_mp scriptCHOP — in-TD MediaPipe pose -> same channels as the retired
# browser 'pose' CHOP (lWrist/rWrist/head/torso _u/_v/_c, wrists also _spd).
# Feeds camera_in frames to the async mp_engine and reads the latest result.
# Coords match the old pipeline: u = 1 - x (selfie mirror), v = 1 - y (y-up).
import sys
import math

if 'C:/projects/CBL/td' not in sys.path:
    sys.path.append('C:/projects/CBL/td')
import numpy as np
import cv2
import mp_engine

CBL = op('/project1/cbl')
KEYS = ('lWrist', 'rWrist', 'head', 'torso')
IDX = {'nose': 0, 'lsh': 11, 'rsh': 12, 'lwr': 15, 'rwr': 16, 'lhip': 23, 'rhip': 24}
CONF_GATE = 0.2


def onCook(scriptOp):
    scriptOp.clear()
    t = absTime.seconds

    # 1. feed the newest camera frame to the async detector (downscaled for speed)
    cam = op('camera_in')
    arr = cam.numpyArray(delayed=True)
    if arr is not None and arr.shape[0] > 1:
        small = cv2.resize(arr[..., :3], (640, 360))  # enough detail for hand landmarks
        rgb = np.ascontiguousarray((np.flipud(small) * 255.0).astype(np.uint8))
        try:
            mp_engine.submit(rgb)
        except Exception:
            pass

    # 2. read the most recent async result
    lms, _mask, _ts = mp_engine.latest()

    st = CBL.fetch('pose_mp_state', {})
    dt = t - st.get('_t', t - 1.0 / 60.0)
    if dt <= 0.0:
        dt = 1.0 / 60.0
    alpha = 1.0 - math.exp(-dt / 0.08)  # ~80ms low-pass

    targets = {}
    if lms:
        nose, lsh, rsh = lms[IDX['nose']], lms[IDX['lsh']], lms[IDX['rsh']]
        lwr, rwr = lms[IDX['lwr']], lms[IDX['rwr']]
        lhip, rhip = lms[IDX['lhip']], lms[IDX['rhip']]
        targets['head'] = (1 - nose[0], 1 - nose[1], nose[2])
        targets['lWrist'] = (1 - lwr[0], 1 - lwr[1], lwr[2])
        targets['rWrist'] = (1 - rwr[0], 1 - rwr[1], rwr[2])
        tx = (lsh[0] + rsh[0]) / 2.0
        if lhip[2] > 0.35 and rhip[2] > 0.35:
            ty = (lsh[1] + rsh[1] + lhip[1] + rhip[1]) / 4.0
        else:
            ty = (lsh[1] + rsh[1]) / 2.0 + 0.2
        targets['torso'] = (1 - tx, 1 - ty, min(lsh[2], rsh[2]))

    rows = []
    for k in KEYS:
        tgt = targets.get(k)
        pu = st.get(k + '_u', 0.5)
        pv = st.get(k + '_v', 0.5)
        if tgt and tgt[2] > CONF_GATE:
            u, v, c = tgt
            su = pu + (u - pu) * alpha
            sv = pv + (v - pv) * alpha
        else:
            su, sv, c = pu, pv, 0.0  # hold last position, zero confidence
        spd = math.hypot(su - pu, sv - pv) / dt
        rows.append((k, su, sv, c, spd))
        st[k + '_u'] = su
        st[k + '_v'] = sv
    st['_t'] = t
    CBL.store('pose_mp_state', st)

    def emit(name, val):
        scriptOp.appendChan(name).vals = [float(val)]

    for k, su, sv, c, spd in rows:
        emit(k + '_u', su)
        emit(k + '_v', sv)
        emit(k + '_c', c)
        if k in ('lWrist', 'rWrist'):
            emit(k + '_spd', spd)
