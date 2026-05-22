# CBL Project Notes

Date: 2026-05-22

This folder is a handoff/reference area for the CBL web app. It exists so the project can be resumed by the team, Codex, Claude, or another assistant without needing the full chat history.

## Start Here

- [Current status](./current-status.md): what the app does now, what is broken, and what checks were run.
- [MATLAB integration ideation](./matlab-integration-ideation.md): how the teammate MATLAB work can be brought into the web app.
- [AI handoff](./ai-handoff.md): concise context for Claude/Codex before making future changes.

## One Sentence Project Summary

The app is becoming an interactive singing bowl installation: the camera shows a person, heartbeat controls the pulsing aura, bowl sound controls the cymatics and chakra color, and the poem responds to the body and sound state.

## Current Best Next Step

The first integration pass is now implemented:

```text
bowl sound -> browser mic -> strongest frequencies -> nearest chakra -> cymatics color/pattern -> poem context
```

Next, test it with a real bowl/microphone and tune the frequency thresholds if the detected chakra jumps too much.
