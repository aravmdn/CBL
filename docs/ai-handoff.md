# AI Handoff Notes

Date: 2026-05-29 (original) · **current-state note added 2026-06-16**

This file is for Claude, Codex, or another coding assistant picking up the CBL project.

> **⚠️ 2026-06-16 — current state (read before the historical log below).** Most of this file
> is a 2026-05-29 snapshot framed around the web app + the GPU particle system. Both are now
> secondary/dormant. What's actually live in `td/cbl.toe`:
> - **Visible:** live camera + finger-stirred **flowing-ink aura** (`flow`) + a **Chladni figure
>   that morphs continuously with bowl pitch** + aurora + sand grain → `master_out`. The
>   2048-particle system and wrist `aura_warp`/`orbs` are **dormant** (not composited).
> - **Pose/hands:** TD-native MediaPipe (`pose_mp`/`hands_mp`), no browser. Track B is **done**.
> - **Audio:** `audio_out` true-pitch detector (linear `spectrum` + harmonic-product-spectrum);
>   `peakHz` drives figure + aura; chakra hue = colour. Mic added on demand by `enable_bowl_audio.py`.
> - **Heartbeat:** live Arduino BPM on COM7 (`pulse_serial` chain); always breathes (amp 0.55 sim /
>   1.0 live).
> - **Latest work + how to continue:** `docs/touchdesigner-chladni-implementation-2026-06-09.md` §11,
>   `docs/touchdesigner-heartbeat-serial-2026-06-09.md`, `td/README.md`. **Next = live aesthetic
>   tuning with the real bowl in a quiet room.** Build/edit the network via the `claude-touchdesigner`
>   MCP (port 44444); disable the bowl mic + serial before any `project.save`.

## Read These First

1. `docs/touchdesigner-onesurface-2026-05-27.md` — **the authoritative architecture (TD-primary, standalone).**
2. `CLAUDE.md`
3. `docs/touchdesigner-resume-2026-05-27.md` — running TD build log / where to continue.
4. `docs/current-status.md`
5. `README.md`

Important:
- **TouchDesigner is the PRIMARY system.** The installation is `td/cbl.toe`, run standalone on
  one webcam with no browser. The React/Vite web app is a secondary dev tool / fallback. Do not
  re-assume the web app is the deliverable.
- **Poetry is permanently removed** (confirmed Meeting 5.2, 2026-05-22). Do not treat it as part
  of the active product unless the user explicitly says otherwise.

## Project Direction

A live visual installation **rendered in TouchDesigner**:

```text
Tibetan singing bowl + person on camera + heartbeat -> TouchDesigner GPU visuals -> projector
```

The intended final interaction (all in TD, no browser):

```text
person stands/sits in front of the webcam
-> TD captures the camera and runs MediaPipe pose tracking itself
-> bowl mic -> chakra color; heartbeat -> pulse
-> hands pull glowing GPU particles; aura warps toward the hands
-> cymatics + aurora + camera composite to master_out on the projector
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
1. Open TouchDesigner with `td/cbl.toe` (the API tox is embedded). Set play state if paused.
2. The MCP listens on port 44444 — verify with `Get-NetTCPConnection -LocalPort 44444 -State Listen`.
3. Run `/touchdesigner` in Claude Code to load the skill.
4. Then ask Claude to build/edit TD networks in natural language.

As of 2026-05-29, **`td/cbl.toe` is the primary output path** — the full reactive build
(hand-particle feature, aura warp, camera/cymatics/aurora composited to `master_out`). The
previous simpler grid file is backed up locally as `td/cbl.toe.bak` (git-ignored). The
TD-native pose engine (`td/mp_engine.py` + `td/pose_mp_callbacks.py`, recovered/committed
2026-05-29) makes it run with no browser; **`pose_mp`/`hands_mp` are now wired into the `.toe`
(Track B done 2026-05-29)** and the build has since moved to the flow/Chladni visuals — see the
2026-06-16 current-state note at the top of this file.

## TouchDesigner Hand-Particle Feature (2026-05-26 → 2026-05-28)

Three-session arc that built and shipped a GPU particle system whose 2048 particles are
pulled to the person's wrists by the live web-app pose stream.

- **2026-05-26 (handoff doc):** built the pose bridge (web → TD over WS:9980) and the
  particle ops (`p_init`, `p_fb`, `p_sim`, `p_chop`, `p_geo`, `p_render`, etc.). Physics
  proven correct (p_sim positions correctly span ±0.23 for hands at u=0.30/0.70) but a
  render-mapping bug stacked all 2048 instances at screen center.
- **2026-05-27 (resume doc):** root cause found — `p_geo.par.instancing` master toggle was
  False. Fixed via SOP instancing path (`p_ctsop` choptoSOP), particles render at hand
  pixels, aura_warp built, full composite chain assembled. Saved as `td/cbl_hands_wip.toe`.
- **2026-05-28 (this commit pair, `2109600` + `5e09fe6`):** promoted WIP → `td/cbl.toe`
  (old cbl.toe kept as `td/cbl.toe.bak`). Synthetic-pose smoke test uncovered three more
  latent bugs and fixed them: `uTorso.x` unbound (home offset), `uSpeed.{x,y,z,w}` all
  unbound (scatter + energy noise dead), `root.time.play = False` (feedback shader did not
  iterate). After fixes, synthetic hands produced 1031 / 1006 / 0 particle distribution at
  L hand / R hand / center — exactly as designed.

**Still pending:** live end-to-end test with a person in front of the camera. The build is
proven correct end-to-end via synthetic data; the unverified piece is aesthetic feel
(gather speed, scatter threshold, glow intensity).

See `docs/touchdesigner-resume-2026-05-27.md` for the operator-level log and `docs/archive/touchdesigner-handoff-2026-05-26.md` for the original build journal.

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

See `docs/archive/touchdesigner-reference.md` for the full handoff.

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
cd legacy/web
npm run lint
npm run test
npm run build
npm run test:e2e
```

Manual check:

```powershell
cd legacy/web
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
