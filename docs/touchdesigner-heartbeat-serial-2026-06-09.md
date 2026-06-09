# Live heartbeat → TouchDesigner: serial diagnosis + migration plan (2026-06-09)

Session notes from getting the physical Arduino pulse sensor to actually drive the
`heartbeat` LFO in TouchDesigner, plus the plan to make future tuning compile-free.

Context: `td/cbl.1.toe` open, MAX30102 sensor wired to an Arduino, board plugged into
Arav's laptop over USB. The software chain
(`pulse_serial → pulse_callbacks → bpm_raw → bpm_smooth → heartbeat.frequency`) was
already built and committed on 2026-05-29; this session was about making the *hardware*
side feed it for the first time.

## TL;DR

- **It works.** The board streams clean bare-number BPM at 115200 (e.g. `62.63`), the
  parser accepts it, and `heartbeat.frequency` tracked it live.
- **The blocker was DTR/RTS, not the code.** This native-USB board discards its serial
  TX until the host raises **both DTR and RTS**. TD's `serialDAT` defaulted to
  `rts = disable`, so it got **zero bytes** even though the port opened without error.
  Fix: set `rts = 'enable'` (DTR was already on). Committed as `6364ddf`.
- **The Arduino is on `COM7`** (`USB Serial Device`). COM3–6 on this laptop are
  `Standard Serial over Bluetooth link` — **not** the Arduino. The old default of `COM5`
  in `enable_pulse_serial.py` was a Bluetooth port; now defaults to `COM7`.
- **The "sometimes doesn't work" flakiness is hardware/contact, not code.** A new
  MAX30102 (I²C, from TinyTronics — same chip) is on order; the fix carries over 1:1.

## What was wrong, step by step

1. **Not enabled.** On open, `pulse_serial` was `active=False`, `port=''` → TD sat on the
   70 BPM fallback (`bpm_raw` default). So nothing was being read at all.
2. **Wrong default port.** `enable_pulse_serial.py` defaulted to `COM5`, which on this
   laptop is a Bluetooth serial link. The Arduino enumerates as **`USB Serial Device
   (COM7)`** — the only non-Bluetooth COM port. (Confirmed via
   `Get-CimInstance Win32_PnPEntity | ? Name -match 'COM\d+'`.)
3. **DTR alone → zero bytes.** With `port=COM7`, `baud=115200`, `format=perline`,
   `dtr=enable`, `rts=disable`, TD opened the port with **no error** but received **0
   rows** over several seconds — *even with a finger on the sensor*.
4. **Proven from outside TD.** Releasing the port and reading COM7 directly from PowerShell
   with **both** `DtrEnable=$true` and `RtsEnable=$true` produced a clean stream:
   `166.67, 88.63, 96.77, 46.99, 83.57` (warm-up jitter) settling to `62.63` (resting).
   This matches `heartbeat_stream.ino`'s `Serial.println(avg, 1)` exactly → firmware is
   flashed and fine; the sensor reads a real pulse.
5. **Fix in TD.** Setting `pulse_serial.par.rts = 'enable'` made TD receive data: row
   `'125.52'`, `bpm_raw` jumped off 70, `heartbeat.frequency` tracked it. The tolerant
   parser also correctly rejected a fragment line `'.72'` (→ 0.72, below the 40 BPM floor).

### Why DTR/RTS matters here

The board presents as a generic **"USB Serial Device"** (native-USB CDC, not an FTDI/CH340
UART). Many such boards/cores buffer or discard serial TX until the host asserts the modem
control lines — the Arduino IDE Serial Monitor raises them, which is the classic "works in
the Serial Monitor but not in my program" symptom. TD's `serialDAT` exposes `dtr` and `rts`
params; **both must be `enable`** for this board.

### Board reset / re-enumeration gotcha

Opening or closing the port toggles DTR/RTS, which **resets the board** and makes it
**re-enumerate** on USB. Symptoms seen this session:
- After TD released COM7, a PowerShell open failed with `Could not find file 'COM7'`
  (the port had momentarily vanished mid-reset); re-plugging brought it back as `COM7`.
- Each fresh open costs ~2 s of bootloader/`setup()`, then the MAX3010x's `checkForBeat`
  needs a few more seconds of clean signal to lock onto the pulse waveform → the first
  readings are sparse and jumpy (the `166 → 62` settling above).

**Practical rule:** enable the serial **once** and leave it open; don't toggle it. Hold a
firm, still fingertip and give it ~15–20 s to settle into the real resting rate.

## Current operational runbook (demo laptop)

```text
1. Open td/cbl.toe (or cbl.1.toe) in TouchDesigner.
2. Confirm the Arduino's COM port in Device Manager → Ports (COM & LPT).
   On Arav's laptop it is COM7; re-plugging can change the number.
3. Paste td/enable_pulse_serial.py into the Textport (now defaults COM7 + DTR&RTS),
   or call enable_pulse_serial('COMxx') via the claude-touchdesigner MCP.
4. Rest ONE fingertip firmly and still on the sensor; the other hand stays free for
   the camera. Give it ~15–20 s; watch bpm_smooth settle and the aura/particles pulse.
5. Before saving or unplugging: call disable_pulse_serial() to release the port
   (bpm_raw holds the last measured BPM, so the pulse keeps going).
```

The serial device stays **OFF in the committed `.toe`** for portability (a COM port bound
to a machine that doesn't have it errors on open) — same convention as the bowl mic.

## Sensor reliability (the new sensor + this one)

- "Differing detections / sometimes just doesn't work" is **finger contact + board
  quality**, not the firmware. `heartbeat_stream.ino` is silent by design when no finger
  is present (IR < 50000) or no beat is confidently detected → TD holds the last BPM.
- **New sensor on order: MAX30102 I²C (TinyTronics).** Same chip as the current one, so
  everything here (firmware, serial setup, the migration below) drops in unchanged.
- **Heads-up:** the cheap purple/GY-style MAX30102 breakouts are known for marginal I²C
  (on-board pull-ups tied to the wrong voltage rail), which produces exactly this
  intermittent symptom. If a fresh board is still flaky, add external **4.7 kΩ pull-ups to
  3.3 V** on SDA/SCL.
- Tuning levers if needed: lower/raise `FINGER_IR` to match the module's actual IR
  baseline; bump `setPulseAmplitudeRed` for a stronger signal; shield from ambient light;
  use a clip/strap to keep the fingertip still.

## Migration plan — move beat detection off the Arduino (NOT YET BUILT)

**Status: proposed and agreed in concept; user said "not yet." Awaiting go-ahead.**

Goal: kill the compile/reflash loop and make detection live-tunable and diagnosable.

| Side | Today | After |
|---|---|---|
| Arduino | runs `checkForBeat`, thresholds, averaging; sends final BPM | **dumb firehose**: `Serial.println(sensor.getIR())` ~100×/s; never changes again |
| TouchDesigner | parses a BPM number | does finger-detect + beat-detect + BPM + smoothing in Python |

- Nothing physical changes: same sensor, same Arduino (still the I²C→USB bridge), same plug.
  Only the *math* moves from C++ on the chip to Python in TD.
- New files to write: `td/arduino/heartbeat_raw/heartbeat_raw.ino` (~10 lines) and a
  rewritten `pulse_callbacks` that ingests the raw-IR stream.
- Downstream is untouched: still feeds `bpm_raw → bpm_smooth → heartbeat.frequency`.
- **Why it helps:** all tuning becomes editing Python (instant) instead of recompiling
  firmware (slow); and the continuous raw stream lets us *plot the actual PPG signal* in TD
  to see why detection fails, instead of the board going silently dark.
- **Sequence when greenlit:** write both files → user does **one final flash** of
  `heartbeat_raw.ino` → switch `pulse_serial.callbacks` to the new detector → tune live
  against the current sensor (works identically for the incoming TinyTronics board).
- Bandwidth is a non-issue (100 lines/s × ~6 chars ≪ 115200 baud).

### Constraint discovered: no `pyserial` inside TD

`import serial` inside TD's Python fails (`No module named 'serial'`). So host-side beat
detection must run **inside the `serialDAT`'s `onReceive` callback** (TD already delivers
each line there) — not via a pyserial thread. The raw-IR plan already assumes this.

## Faster Arduino iteration (until/unless detection moves to TD)

- The firmware works — **stop recompiling to fix detection**; that's a sensor/contact
  problem. Flash once, leave it.
- If you must iterate: **exclude the build dir from Windows Defender** (`%LOCALAPPDATA%\
  Arduino15` and `%TEMP%\arduino*`) — AV scanning every object file is the biggest Windows
  compile slowdown. Keep the IDE open and don't switch boards (the core stays cached after
  the first build). Or use **arduino-cli / PlatformIO** for proper incremental builds.
- A "faster Arduino" won't help: compile time is host-toolchain bound, not board bound.

## Pointers

- Code fix: commit `6364ddf` (`td/enable_pulse_serial.py` → COM7 + DTR&RTS).
- Firmware: `td/arduino/heartbeat_stream/heartbeat_stream.ino` (current, on the board).
- Chain + prior build: `memory/heartbeat_arduino_hardware.md`, CLAUDE.md "What Is Done".
