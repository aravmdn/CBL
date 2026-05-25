# Enable live Tibetan-bowl chakra detection in the CBL TouchDesigner network.
#
# WHY THIS IS SEPARATE FROM cbl.toe:
#   An `audiodeviceinCHOP` is intentionally NOT saved inside cbl.toe. On Arav's
#   dev machine, TouchDesigner HANGS (UI alive, HTTP/MCP frozen) whenever it
#   touches the audio device during creation OR during project.save (device
#   enumeration). To keep cbl.toe reliably openable and savable, the live mic is
#   added on demand by this script and removed before saving.
#
#   The chakra-detection logic itself lives in the `audio_out` scriptCHOP inside
#   cbl.toe and works with NO input (safe defaults). Feeding it the bowl spectrum
#   turns on real Solfeggio detection.
#
# HOW TO RUN (on the DEMO LAPTOP, where the bowl mic works):
#   1. Open td/cbl.toe in TouchDesigner.
#   2. Open the Textport and paste this whole file, OR run it via the
#      claude-touchdesigner MCP (td_execute).
#   3. cymatics + aurora now react to the live bowl; chakra hue follows the pitch.
#
# IMPORTANT: before saving cbl.toe on a machine whose audio driver hangs TD,
#   call disable_bowl_audio() first.

CBL = '/project1/cbl'


def enable_bowl_audio(device=''):
    cbl = op(CBL)
    audio_out = op(CBL + '/audio_out')
    if audio_out is None:
        raise RuntimeError('audio_out scriptCHOP not found - open td/cbl.toe first')

    mic = op(CBL + '/bowl_mic')
    if mic is None:
        mic = op.TDAPI.CreateOp(cbl, audiodeviceinCHOP, 'bowl_mic', x=-800, y=400)
    mic.par.active = 1
    if device:
        mic.par.device = device  # optional: pin a specific input device by name

    spec = op(CBL + '/spectrum')
    if spec is None:
        spec = op.TDAPI.CreateOp(cbl, audiospectrumCHOP, 'spectrum', x=-600, y=400)
    spec.inputConnectors[0].connect(mic)

    # feed the FFT magnitude spectrum into the chakra-detection scriptCHOP
    audio_out.inputConnectors[0].connect(spec)
    print('Bowl audio ENABLED. cymatics/aurora now react to the live bowl.')


def disable_bowl_audio():
    # Remove the live audio device. Required before saving on a machine whose
    # audio driver hangs TD during save. audio_out reverts to safe defaults.
    for nm in ('spectrum', 'bowl_mic'):
        o = op(CBL + '/' + nm)
        if o:
            o.destroy()
    print('Bowl audio DISABLED. audio_out falls back to safe defaults.')


# Auto-run when pasted into the Textport:
enable_bowl_audio()
