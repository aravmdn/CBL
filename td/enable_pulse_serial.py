# Enable the live Arduino pulse sensor (heartbeat) in the CBL TouchDesigner network.
#
# WHAT THIS DOES:
#   The heartbeat in cbl.toe is an `lfo` CHOP named `heartbeat` whose `beat`
#   channel drives the aura / particles / cymatics / aurora pulse. Its FREQUENCY
#   is driven by a smoothed live-BPM chain:
#
#       pulse_serial (serialDAT, OFF in the saved file)
#         -> pulse_callbacks (parses each line to a BPM float, both teammate sketches)
#         -> bpm_raw (constantCHOP 'bpm', holds last good value; resting default 70)
#         -> bpm_smooth (lagCHOP, eases between heart rates)
#         -> heartbeat.frequency = max(0.3, bpm_smooth['bpm']/60)
#
#   With the serial device OFF (the saved state) the chain sits at 70 BPM, so the
#   file opens identically to the sim on any machine with no Arduino attached.
#
# WHY THE SERIAL DEVICE IS OFF IN cbl.toe:
#   A serialDAT bound to a COM port that does not exist on the current machine
#   would error on open. Keeping it OFF (active=False, port='') means cbl.toe is
#   portable. This mirrors td/enable_bowl_audio.py.
#
# HARDWARE / FIRMWARE:
#   MAX30102/MAX30105 pulse oximeter, Serial @ 115200, 8-N-1.
#   Flash td/arduino/heartbeat_stream/heartbeat_stream.ino (recommended: clean
#   continuous smoothed numbers). The bare-number and "AVERAGE BPM: 70" formats
#   are BOTH parsed. Staging: one hand on the sensor, the other hand free for the
#   camera.
#
# HOW TO RUN (on the DEMO LAPTOP, Arduino plugged in):
#   1. Open td/cbl.toe in TouchDesigner.
#   2. Find the Arduino's COM port (Windows Device Manager -> Ports (COM & LPT)).
#   3. Open the Textport and paste this whole file, editing PORT below, OR call
#      enable_pulse_serial('COM5') via the claude-touchdesigner MCP (td_execute).
#
# BEFORE SAVING on this laptop: call disable_pulse_serial() to release the port.

CBL = '/project1/cbl'
PORT = 'COM5'   # <-- EDIT to your Arduino's COM port


def build_pulse_chain():
    """Idempotently (re)create the live-BPM chain. Safe to call on an older cbl.toe."""
    cbl = op(CBL)
    if cbl is None:
        raise RuntimeError('/project1/cbl not found - open td/cbl.toe first')

    bpm_raw = op(CBL + '/bpm_raw')
    if bpm_raw is None:
        bpm_raw = cbl.create(constantCHOP, 'bpm_raw')
        bpm_raw.nodeX, bpm_raw.nodeY = -760, 640
    bpm_raw.par.name0 = 'bpm'
    if bpm_raw.par.value0.eval() == 0:
        bpm_raw.par.value0 = 70

    bpm_smooth = op(CBL + '/bpm_smooth')
    if bpm_smooth is None:
        bpm_smooth = cbl.create(lagCHOP, 'bpm_smooth')
        bpm_smooth.nodeX, bpm_smooth.nodeY = -600, 640
    bpm_smooth.par.lag1 = 1.0
    bpm_smooth.par.lag2 = 2.0
    bpm_smooth.inputConnectors[0].connect(bpm_raw)

    cb = op(CBL + '/pulse_callbacks')
    if cb is None:
        cb = cbl.create(textDAT, 'pulse_callbacks')
        cb.nodeX, cb.nodeY = -1000, 520
        cb.text = (
            'import re\n\n'
            'def onReceive(dat, rowIndex, message, bytes):\n'
            '    nums = re.findall(r"[-+]?\\d*\\.?\\d+", message or "")\n'
            '    if not nums:\n'
            '        return\n'
            '    try:\n'
            '        bpm = float(nums[-1])\n'
            '    except ValueError:\n'
            '        return\n'
            '    if 40.0 <= bpm <= 180.0:\n'
            "        op('bpm_raw').par.value0 = bpm\n"
            "        op('bpm_raw').store('last_frame', absTime.frame)\n"
            '    return\n'
        )

    ser = op(CBL + '/pulse_serial')
    if ser is None:
        ser = cbl.create(serialDAT, 'pulse_serial')
        ser.nodeX, ser.nodeY = -1000, 660
    ser.par.baudrate = 115200
    ser.par.stopbits = 1
    ser.par.format = 'perline'
    ser.par.callbacks = 'pulse_callbacks'

    # heartbeat frequency follows smoothed BPM (floor keeps the pulse alive)
    hb = op(CBL + '/heartbeat')
    if hb is not None:
        hb.par.frequency.expr = "max(0.3, op('bpm_smooth')['bpm']/60.0)"
    return ser


def enable_pulse_serial(port=None):
    ser = build_pulse_chain()
    ser.par.port = port or PORT
    ser.par.active = True
    print('Pulse serial ENABLED on', ser.par.port.eval(),
          '- heartbeat now follows the live sensor BPM.')


def disable_pulse_serial():
    # Release the COM port (call before saving / unplugging). bpm_raw holds its
    # last value, so the heartbeat keeps pulsing at the last measured rate.
    ser = op(CBL + '/pulse_serial')
    if ser:
        ser.par.active = False
        ser.par.port = ''
    print('Pulse serial DISABLED. heartbeat holds the last measured BPM.')


# Auto-run when pasted into the Textport:
enable_pulse_serial()
