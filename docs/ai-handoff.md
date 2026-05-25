# AI Handoff Notes

Date: 2026-05-25

This file is for Claude, Codex, or another coding assistant picking up the CBL project.

## Read These First

1. `docs/current-status.md`
2. `docs/matlab-integration-ideation.md`
3. `docs/touchdesigner-reference.md`
4. `CLAUDE.md`
5. `README.md`

Important: `README.md` has been updated for the current bowl installation. `CLAUDE.md` is still useful as architecture context, but the current server code is under `server/`.

## Project Direction

The app is now aimed at a live installation:

```text
Tibetan singing bowl + person on camera + heartbeat + AI poem
```

The intended final interaction:

```text
person stands/sits in front of camera
-> bowl sound is captured by microphone
-> app detects bowl frequencies and chakra color
-> aura/cymatics respond visually
-> heartbeat controls pulse
-> poem is generated from body/sound state
```

## User Preference From Discussion

The user prefers a simple, understandable explanation over heavy technical language.

When writing docs or presentation copy:

- Avoid jargon where possible.
- Explain the teammate MATLAB work as "sound analysis".
- Explain the web app as "showing what the bowl is doing".
- Keep group-facing text short and clear.

Useful phrase:

```text
The MATLAB part analyzes the sound. The web app turns that analysis into the live visuals.
```

## Recent User Requests And Decisions

### Teammate MATLAB Integration

User request:

```text
Integrate teammate MATLAB work into the web app.
```

Decision:

Translate the MATLAB signal-processing idea into browser code, not run MATLAB directly.

Result:

- live mic FFT/top-frequency analysis
- nearest chakra detection
- cymatics driven by detected frequencies
- poem API receives heartbeat plus chakra context

### TouchDesigner TikTok Reference

User request:

```text
https://vm.tiktok.com/ZGdHggUDC/
go through this tiktok and follow the tutorial
```

Reference link:

- https://vm.tiktok.com/ZGdHggUDC/
- resolved: https://www.tiktok.com/@studio.kashi/video/7617655149653167390

Decision:

The TikTok is a TouchDesigner learning path, not a direct React tutorial. The project stayed a React/Vite app. The useful tutorial ideas were translated into the canvas:

- white abstract visuals
- audio-reactive bloom particles
- hand/body tracking nodes

See `docs/touchdesigner-reference.md` for the full handoff.

## Do Not Accidentally Remove These

The following are untracked but important:

```text
EngineeringArt CBL/
EngineeringArt CBL.zip
engineering-art-design-ai-research.md
tmp/
```

The `EngineeringArt CBL/` folder and zip are teammate work. Treat them as reference material unless the user asks to move, clean, or commit them.

## Current Technical State

### Frontend/server poem payload

Frontend and server now use the bowl meditation payload:

```json
{
  "session": "bowl-meditation",
  "heartbeat": {
    "bpm": 68,
    "trend": "calming",
    "variability": 0.4,
    "dominantChakra": {
      "name": "Heart",
      "frequency": 639,
      "color": "#00ff00"
    }
  }
}
```

### Live chakra is wired

`src/audio/useMicInput.ts` now returns:

```text
frequencyPeaks
dominantFrequency
dominantChakra
```

`src/App.tsx` passes chakra data to both `CameraStage` and `requestPoem`.

### TouchDesigner-style visual pass

After reviewing the TikTok reference, `CameraStage` also includes a stronger visible layer:

- white abstract visual field
- audio-reactive bloom particles
- wrist/shoulder/head tracking nodes
- chakra/frequency text in the stage status when detected

Implementation files:

- `src/camera/usePoseTracking.ts`
- `src/components/CameraStage.tsx`
- `src/App.tsx`
- `src/types.ts`

### E2E test

`tests/e2e/cbl.spec.ts` now covers the bowl microphone flow instead of the old sample-player UI.

### Lint

Known lint failures were fixed during the integration pass.

## Remaining Risk

The main remaining risk is not TypeScript/test coverage. It is real-world signal quality and visual strength. The detection thresholds in `src/audio/useMicInput.ts` may need tuning with the actual bowl, room, and microphone. The TouchDesigner-inspired visual intensity in `src/components/CameraStage.tsx` may also need tuning after seeing it on the demo laptop/projector.

## Suggested Next Plan

1. Run the app with the real bowl and mic.
2. Watch whether the detected chakra is stable.
3. Tune the constants in `src/audio/useMicInput.ts` if needed.
4. Consider adding a small on-screen chakra readout for demo/explanation.
5. Keep `README.md` and this `docs/` folder updated as the physical demo behavior changes.

## Verification Commands

Run after implementation:

```powershell
npm run lint
npm run test
npm run build
npm run test:e2e
```

Manual check:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Check:

- camera fallback or camera feed appears
- microphone button works
- aura/cymatics are visible when session is active
- poem generation does not fail from request validation
- no old sample-player UI assumptions remain in tests/docs
