# Code Snapshot — Map of the Program Files

_Snapshot date: 2026-05-26 · read-only copy for coding teammates and their AI assistant_

These are copies of the most important source files from the CBL web app, included so a
coding teammate (or their AI assistant) can read the actual code without the full repo.
**This is a reference snapshot, not the live project** — to actually run or change the
app, work in the real repository.

## How the app is wired (high level)

```text
useMicInput     ─┐
useHeartbeat    ─┤
useCamera       ─┼──►  App.tsx  ──►  CameraStage.tsx  ──►  the on-screen visuals
usePoseTracking ─┤
usePoseStream   ─┘     (usePoseStream also sends body/hand positions to TouchDesigner)
```

## File-by-file

| File | What it does |
|---|---|
| `App.tsx` | Main app shell. Holds the state, the microphone toggle, the heartbeat readouts, and passes all the signals into the visual stage. |
| `components/CameraStage.tsx` | The canvas where everything is drawn: camera feed, colour wash, cymatics ripples, aurora, body aura, bloom particles, and tracking nodes. The visual heart of the app. |
| `audio/useMicInput.ts` | Captures the bowl microphone, finds the strongest frequency peaks, and detects the nearest chakra. |
| `audio/audioAnalysis.ts` | The maths for chakra detection (396–963 Hz), band energy, and frequency analysis. Holds the chakra colour table. |
| `audio/useHeartbeat.ts` | The heartbeat. Currently a realistic **simulation** (slowly calming BPM with natural variation). The clearly-marked spot to plug in the real Arduino sensor later. |
| `camera/usePoseTracking.ts` | Body/pose tracking (MediaPipe): finds head, shoulders, wrists, torso. Mirrored for a selfie view. |
| `camera/useCamera.ts` | Opens the webcam. |
| `net/usePoseStream.ts` | The bridge that streams body/hand positions to TouchDesigner over a local connection. Off by default; only on when connecting to TouchDesigner. |
| `types.ts` | Shared TypeScript types used across the app. |
| `package.json` | The project's dependencies and run/test commands. |

## Running it (in the real repo, not this snapshot)

```text
npm install
npm run dev        # starts the app at http://127.0.0.1:5173/
npm test           # runs the tests
npm run build      # type-check + production build
```

No API key is needed for the visual app.

## Note on "poetry" files

The live repository still contains some old, unused "poem" code (e.g. a `poetry/`
folder and a small server). It is **not part of the current project** and is not
included in this snapshot. Ignore it.
