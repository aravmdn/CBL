# CBL Project Notes

Date: 2026-05-25

This folder is a handoff/reference area for the CBL web app. It exists so the project can be resumed by the team, Codex, Claude, or another assistant without needing the full chat history.

## Start Here

- [Current status](./current-status.md): what the app does now, what is broken, and what checks were run.
- [MATLAB integration ideation](./matlab-integration-ideation.md): how the teammate MATLAB work can be brought into the web app.
- [TouchDesigner reference handoff](./touchdesigner-reference.md): TikTok source link, visual goal, and implemented white/audio/hand-tracking pass.
- [AI handoff](./ai-handoff.md): concise context for Claude/Codex before making future changes.

## One Sentence Project Summary

The app is becoming an interactive singing bowl installation: the camera shows a person, heartbeat controls the pulsing aura, bowl sound controls the cymatics and chakra color, and the poem responds to the body and sound state.

## Current Best Next Step

The first integration pass is now implemented:

```text
bowl sound -> browser mic -> strongest frequencies -> nearest chakra -> cymatics color/pattern -> poem context
```

The TouchDesigner-inspired pass is also implemented:

```text
TikTok visual reference -> white visual field -> audio bloom particles -> wrist/body tracking nodes
```

Next, test with the real bowl, mic, and camera in the demo room. Tune the frequency thresholds and visual intensity if the result is too subtle or too jumpy.
