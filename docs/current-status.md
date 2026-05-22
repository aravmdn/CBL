# Current Status

Date: 2026-05-22

## Repository State

- Branch: `main`
- Last base commit before this integration: `c82ddb7 perf(canvas): smooth aura, float poem around person, fix frame churn`
- This note now describes the MATLAB sound-integration work that is ready to commit.
- Untracked project material exists and should not be deleted without asking:
  - `EngineeringArt CBL/`
  - `EngineeringArt CBL.zip`
  - `engineering-art-design-ai-research.md`
  - `tmp/`

The `EngineeringArt CBL/` folder and zip are teammate work. They contain MATLAB files for microphone FFT, cymatics, camera input, and chakra color mapping.

## What The App Does Now

The app is a React/Vite browser prototype for an interactive visual installation.

Current experience:

- Webcam feed appears on a canvas.
- MediaPipe pose tracking finds the person.
- A glowing aura is drawn around the body.
- A simulated heartbeat controls BPM and pulsing.
- The microphone can be turned on for bowl input.
- Browser FFT analysis finds strongest bowl frequencies.
- The nearest chakra is selected from the teammate frequency/color table.
- The cymatics layer uses real frequency peaks with the teammate `frequency / 80` pattern logic.
- Poem generation sends heartbeat plus detected chakra context.
- Poem lines float around the person.
- A seed poem is available when no AI call succeeds.

The visual direction has moved away from the older sample-audio prototype and toward a Tibetan singing bowl / heartbeat / cymatics concept.

## Important Files

- `src/App.tsx`: main UI state, mic toggle, heartbeat state, poem panel.
- `src/audio/useMicInput.ts`: browser microphone capture and frequency bars.
- `src/audio/useHeartbeat.ts`: simulated heartbeat; later replace with Arduino/Web Serial input.
- `src/audio/audioAnalysis.ts`: audio feature extraction and chakra frequency constants.
- `src/components/CameraStage.tsx`: canvas visuals: camera, aura, cymatics, poem text.
- `src/poetry/poemClient.ts`: frontend poem request.
- `server/validation.ts`: server-side poem request validation.
- `server/openaiPoem.ts`: OpenRouter/OpenAI poem generation.
- `CLAUDE.md`: architecture note for Claude/Codex handoff.
- `README.md`: current setup, behavior, API contract, and troubleshooting.

## Checks Run

These checks were run on 2026-05-22 after the MATLAB integration pass:

```powershell
npm run test
```

Result: passed. 5 test files, 17 tests.

```powershell
npm run build
```

Result: passed.

```powershell
npm run test:e2e
```

Result: passed. The Playwright test now starts the bowl mic flow, generates a mocked poem, and checks that the canvas is nonblank.

```powershell
npm run lint
```

Result: passed.

## Known Gaps

### 1. Poem API Contract Has Been Updated

The frontend and server now use:

```json
{
  "session": "bowl-meditation",
  "heartbeat": {
    "bpm": 72,
    "trend": "stable",
    "variability": 0.3,
    "dominantChakra": null
  }
}
```

The server validates this shape and the poem prompt uses BPM, trend, variability, and chakra.

### 2. Chakra Is Wired Through Live Mic

`useMicInput` now exposes:

```text
frequencyPeaks
dominantFrequency
dominantChakra
```

`App` passes `dominantChakra` to:

- `requestPoem(...)`
- `CameraStage`

### 3. Cymatics Now Use The MATLAB Input Logic

`CameraStage` still renders an artistic layer, but its shape now comes from real frequency peaks.

The key teammate formula is preserved:

```text
k = frequency / 80
pattern += magnitude * sin(k * X) * sin(k * Y)
```

### 4. Remaining Practical Risk

The integration is validated with automated tests, but the frequency thresholds still need real-room testing with the actual bowl and microphone.

## Recommended Next Development Order

1. Test with the real bowl and mic.
2. Tune `MIN_PEAK_FREQUENCY`, `MAX_PEAK_FREQUENCY`, `PEAK_SPACING_HZ`, and `MIN_DOMINANT_MAGNITUDE` in `src/audio/useMicInput.ts` if chakra detection is unstable.
3. Add a small visible chakra label if the group wants the teammate contribution to be easier to demonstrate.
4. Update `README.md` after the behavior is stable.
