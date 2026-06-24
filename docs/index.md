# CBL Project Notes

Date: 2026-05-29

This folder is a handoff/reference area for CBL. It exists so the project can be resumed by the team, Codex, Claude, or another assistant without needing the full chat history.

**The installation is built in TouchDesigner (`td/cbl.toe`), standalone — that is the primary system.** The React/Vite web app is a secondary dev tool / fallback.

## Start Here

- [**TouchDesigner — One Surface (standalone architecture)**](./touchdesigner-onesurface-2026-05-27.md): **the authoritative architecture.** TD does camera + pose + particles + aura + audio on one webcam, no browser.
- [TouchDesigner resume plan](./touchdesigner-resume-2026-05-27.md): the single entry point to continue TD work (running log of what's done).
- [TouchDesigner for teammates](./touchdesigner-for-teammates.md): plain-language explainer of the TD build for Group 5.
- [TouchDesigner hand-particle handoff](./archive/touchdesigner-handoff-2026-05-26.md): operator-level build log for the GPU particle + aura feature.
- [TouchDesigner MCP](./touchdesigner-mcp.md): how to use the claude-touchdesigner plugin to build TD networks from Claude Code.
- [Current status](./current-status.md): current state, what is parked, and checks run.
- [AI handoff](./ai-handoff.md): concise context for Claude/Codex before making future changes.
- [MATLAB integration ideation](./archive/matlab-integration-ideation.md): how the teammate MATLAB work connects to the project.
- [TouchDesigner reference handoff](./archive/touchdesigner-reference.md): the original TikTok-driven canvas pass (now superseded by the TD-primary direction).
- [Chladni particle plate — breakdown, source paper & graft plan](./archive/touchdesigner-chladni-particles-2026-06-01.md): full rebuild of the Factory Settings "Audio Reactive Chladni Plate" video, the research paper behind it (Rossing 1982 via Paul Bourke; Ritz 1909 for the figure formula), and a concrete plan to graft the normal-map velocity attractor onto `cbl.toe`. Supports Alejandra's "Chladni Formula" task.
- [**Chladni math — IMPLEMENTED (2026-06-09)**](./touchdesigner-chladni-implementation-2026-06-09.md): what was actually built — the `cymatics` shader now renders the true square-plate Chladni figure (Ritz superposition) driven by bowl pitch → `(n,m)` and heartbeat → breathing. Plain-language maths, parameter mapping, tuning guide, and the Option B (particles-on-nodal-lines) next step.
- [**Live heartbeat → TD: serial diagnosis & migration plan (2026-06-09)**](./touchdesigner-heartbeat-serial-2026-06-09.md): getting the physical Arduino pulse sensor to drive the `heartbeat` LFO — the DTR+RTS gotcha (zero bytes without both), COM7, board reset/re-enumeration, live BPM verified, and the plan to move beat detection off the Arduino into TD to kill the compile loop.
- [**Teammate TouchDesigner file — architect review & merge plan (2026-06-11)**](./touchdesigner-teammate-merge-2026-06-11.md): the EngineeringArt teammate's own `.toe` (`td/incoming/EngineeringArt_TouchDesign_2026-06-11.toe`) — why a `.toe` can't be merged off-tool, the keep/adapt/drop framework against the one-surface architecture, and the in-TD (or MCP-driven) merge procedure. `cbl.toe` is unchanged.

## One Sentence Project Summary

A dark, immersive singing-bowl installation rendered live in TouchDesigner: a person stands in front of the camera, bowl sound drives chakra-colored cymatics and aurora, the heartbeat controls a BPM-colored pulsing aura, and the person's hands pull glowing GPU particles — all from one laptop and webcam, no browser.

## Latest Direction Update

Poetry is permanently off the table (Meeting 5.2, 2026-05-22).

Keep this simple when explaining it:

```text
We decided to focus on the visual installation. The bowl sound and body tracking should make the screen feel alive.
```

The old poem code stays in the repo as dormant legacy code. All new work is visual-installation and report focused.

## Current Best Next Step

The TouchDesigner build (`td/cbl.toe`) is the reactive installation: a 2048-particle GPU
system that gathers to still hands and scatters from fast ones, a hand-warped aura, plus
camera/cymatics/aurora composited to `master_out`. A synthetic-pose smoke test on 2026-05-28
confirmed correct particle distribution (1031 → L, 1006 → R, 0 at center).

The TD-native pose engine that makes it **standalone (no browser)** — `td/mp_engine.py` +
`td/pose_mp_callbacks.py` with bundled offline models — was recovered and committed
2026-05-29. See [the one-surface doc](./touchdesigner-onesurface-2026-05-27.md).

**Open Track B (needs TD running on MCP :44444 + a person, browser closed):**

```text
1. place pose_mp scriptCHOP in /project1/cbl (loads td/pose_mp_callbacks.py)
2. repoint the public `pose` read point from the pose_ws web bridge to pose_mp
3. confirm camera_in is a live videodeviceinTOP (the laptop webcam)
4. verify live with a person: camera live (not frozen), particles/aura react to real hands
5. CheckErrors clean -> save mic-free -> enable bowl audio at runtime -> tune aesthetics
```

Then test with the real bowl, mic, and camera in the demo room.

## Archive

Superseded specs, old plans, and meeting notes live in [`archive/`](./archive/) (see [`archive/README.md`](./archive/README.md)). Kept for provenance; not authoritative. Includes:

- [TouchDesigner reference handoff](./archive/touchdesigner-reference.md) — original TikTok-driven canvas pass.
- [TouchDesigner hand-particle handoff](./archive/touchdesigner-handoff-2026-05-26.md) — GPU particle + aura build log.
- [Chladni particle plate — breakdown & graft plan](./archive/touchdesigner-chladni-particles-2026-06-01.md).
- [TouchDesigner visual redesign (2026-05-29)](./archive/touchdesigner-visual-redesign-2026-05-29.md).
- [TouchDesigner integration plan](./archive/touchdesigner-integration-plan.md).
- [MATLAB integration ideation](./archive/matlab-integration-ideation.md).
- [Engineering-art design AI research](./archive/engineering-art-design-ai-research.md).
- [Meeting summary (2026-05-29)](./archive/meeting-summary-2026-05-29.md).
- [`archive/plans/`](./archive/plans/) — older implementation plans.
