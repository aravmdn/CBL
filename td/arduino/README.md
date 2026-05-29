# Arduino — heartbeat pulse sensor

Hardware: **MAX30102 / MAX30105** pulse oximeter on I2C. Library: SparkFun
**MAX3010x** (`MAX30105.h` + `heartRate.h`). Serial **115200 baud, 8-N-1**.
Streams BPM to TouchDesigner, which drives the `heartbeat` LFO in `td/cbl.toe`
(see `td/enable_pulse_serial.py`). Staging: one hand rests a finger on the
sensor, the other hand is free for the camera.

## `heartbeat_stream/` — flash this one ✅

The firmware used by the installation. Merges the two teammate sketches into one
stream-friendly program: finger detection + rolling 8-beat average + **clean
continuous numeric output** (one bare number per beat, no labels, no blocking).
TouchDesigner's `pulse_serial` DAT reads it directly.

## `reference/` — teammate originals (kept for credit + context)

The sketches our teammate wrote while learning the sensor. Not used at the demo,
but `heartbeat_stream.ino` is derived from them and TD's parser still accepts
their output formats.

| File | What it does |
|---|---|
| `reference/sketch_liveheartarduino/` | Live sketch: streams the **bare** instantaneous BPM per beat. Clean output but jumpy (no averaging). |
| `reference/sketch_liveheartprocessing/` | A **Processing** desktop visualiser (scrolling BPM graph) for the live sketch. Standalone monitor / debug tool — not part of the TD demo. |
| `reference/averagedheartratecbl/` | Robust sketch: finger detection + rolling average over a 10 s window. Smooth, but prints label text and blocks between windows — good for a calibration readout, not for live streaming. |

`heartbeat_stream.ino` = `averagedheartratecbl`'s sensing/averaging + the live
sketch's clean continuous output, minus the blocking wait loop.
