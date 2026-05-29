# CBL Project Notes

Date: 2026-05-29

This folder is a handoff/reference area for CBL. It exists so the project can be resumed by the team, Codex, Claude, or another assistant without needing the full chat history.

**The installation is built in TouchDesigner (`td/cbl.toe`), standalone — that is the primary system.** The React/Vite web app is a secondary dev tool / fallback.

## Start Here

- [**TouchDesigner — One Surface (standalone architecture)**](./touchdesigner-onesurface-2026-05-27.md): **the authoritative architecture.** TD does camera + pose + particles + aura + audio on one webcam, no browser.
- [TouchDesigner resume plan](./touchdesigner-resume-2026-05-27.md): the single entry point to continue TD work (running log of what's done).
- [TouchDesigner for teammates](./touchdesigner-for-teammates.md): plain-language explainer of the TD build for Group 5.
- [TouchDesigner hand-particle handoff](./touchdesigner-handoff-2026-05-26.md): operator-level build log for the GPU particle + aura feature.
- [TouchDesigner MCP](./touchdesigner-mcp.md): how to use the claude-touchdesigner plugin to build TD networks from Claude Code.
- [Current status](./current-status.md): current state, what is parked, and checks run.
- [AI handoff](./ai-handoff.md): concise context for Claude/Codex before making future changes.
- [MATLAB integration ideation](./matlab-integration-ideation.md): how the teammate MATLAB work connects to the project.
- [TouchDesigner reference handoff](./touchdesigner-reference.md): the original TikTok-driven canvas pass (now superseded by the TD-primary direction).

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
