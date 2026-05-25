# AI Handoff Notes

Date: 2026-05-25

This file is for Claude, Codex, or another coding assistant picking up the CBL project.

## Read These First

1. `docs/current-status.md`
2. `docs/matlab-integration-ideation.md`
3. `docs/touchdesigner-reference.md`
4. `CLAUDE.md`
5. `README.md`

Important: the current direction is visual-first. **Poetry is permanently removed** (confirmed Meeting 5.2, 2026-05-22 — "poetry is off the table"). Do not treat it as part of the active product under any circumstances unless the user explicitly says otherwise.

## Project Direction

The app is now aimed at a live visual installation:

```text
Tibetan singing bowl + person on camera + heartbeat + TouchDesigner-style visuals
```

The intended final interaction:

```text
person stands/sits in front of camera
-> bowl sound is captured by microphone
-> app detects bowl frequencies and chakra color
-> aura/cymatics/bloom respond visually
-> heartbeat controls pulse
-> body tracking places the effects around the person
```

## Latest User Decision

The user said the group is likely removing the poetry aspect and focusing completely on design and TouchDesigner-style visuals.

Decision:

- Remove poetry from the active UI.
- Do not show poem panels, poem buttons, poem text, or poem overlays.
- Keep legacy poetry files in the repo only as dormant code.
- Update README and docs so a future AI does not assume poetry is still a live requirement.

## User Preference From Discussion

The user prefers simple explanations over heavy technical language.

When writing docs or presentation copy:

- Avoid jargon where possible.
- Explain the teammate MATLAB work as "sound analysis".
- Explain the web app as "showing what the bowl is doing".
- Keep group-facing text short and clear.

Useful phrase:

```text
The MATLAB part analyzes the sound. The web app turns that analysis into the live visuals.
```

## TouchDesigner MCP Plugin

The `claude-touchdesigner` MCP plugin (v0.1.6) is installed on Arav's machine. It connects Claude Code to a running TouchDesigner instance over HTTP.

To use it in a session:
1. Open TouchDesigner, drag in the TOX (path in `docs/touchdesigner-mcp.md`)
2. Set Port = 44444 on the component
3. Run `/touchdesigner` in Claude Code to load the skill
4. Then ask Claude to build TD networks in natural language

This is for prototyping GLSL effects and visual ideas in TD; the live demo product remains the React/Vite web app.

## Visual Changes Since Midterm (2026-05-19 → 2026-05-25)

These were all implemented in response to Meeting 5 feedback ("UI too cutesy"):

1. **Design system**: #06060C background, Cormorant Garamond, glassmorphism panels, violet borders
2. **BPM→color aura**: violet (<62 BPM), cyan (62–72), amber (72–85), orange (≥85) — biometric color display
3. **Heartbeat animation**: two-phase (80ms attack + 400ms exponential decay), mirrors cardiac pressure wave
4. **OneEuroFilter**: adaptive low-pass on pose landmarks — aura glides instead of snapping
5. **Full CHAKRA_COLORS table**: cymatics render in detected chakra color; gold default when none
6. **Auto-hide control rail**: fades after 3s inactivity, returns on any mouse/touch/key

## Team State (Meeting 5.2, 2026-05-22)

- Poetry permanently off the table
- Bowl ordered (Alice); better Arduino being sourced; black cloth for display
- Report being written on Overleaf (Alice, Joris, Henk)
- Code continues (Arav, Mahiraa, Alejandra)
- Physical assembly being explored by Henk (wood box enclosure / photobooth style)

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
- chakra/frequency data shown through the visual stage

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

### Active App Flow

`src/App.tsx` now wires the active app as:

```text
useMicInput -> CameraStage
useHeartbeat -> CameraStage
useCamera/usePoseTracking -> CameraStage
```

There is no active poem request from the UI.

### Live Chakra Is Wired

`src/audio/useMicInput.ts` returns:

```text
frequencyPeaks
dominantFrequency
dominantChakra
```

`src/App.tsx` passes this data to `CameraStage` and uses it for compact signal readouts.

### TouchDesigner-Style Visual Pass

`CameraStage` includes:

- white abstract visual field
- audio-reactive bloom particles
- wrist/shoulder/head tracking nodes
- chakra/frequency text in the stage status when detected

Implementation files:

- `src/camera/usePoseTracking.ts`
- `src/components/CameraStage.tsx`
- `src/App.tsx`
- `src/types.ts`

### Dormant Legacy Poetry Code

These files remain for now:

- `src/poetry/poemClient.ts`
- `server/app.ts`
- `server/openaiPoem.ts`
- `server/validation.ts`
- `server/*.test.ts`

They are not connected to the active frontend. Do not expand or document them as current behavior unless the user asks to bring poetry back.

### E2E Test

`tests/e2e/cbl.spec.ts` covers the bowl microphone flow and verifies the canvas is nonblank. It also checks that the active page has no visible `Poem` text.

## Remaining Risk

The main remaining risk is real-world signal quality and visual strength.

Check this with the real setup:

- Does chakra detection stay stable with the actual bowl?
- Are the white visual field and bloom particles visible on the projector?
- Do wrist/body tracking nodes appear clearly when the person moves?
- Does the stage feel visually impressive without relying on text?

## Suggested Next Plan

1. Run the app with the real bowl and mic.
2. Watch whether the detected chakra is stable.
3. Tune the constants in `src/audio/useMicInput.ts` if needed.
4. Tune visual intensity in `src/components/CameraStage.tsx`.
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
- no poem panel/button/text appears
- aura/cymatics/bloom are visible when session is active
- no old sample-player UI assumptions remain in tests/docs
