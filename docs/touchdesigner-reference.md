# TouchDesigner Reference Handoff

Date: 2026-05-25

## Why This Exists

The user shared this TikTok and asked to "go through this tiktok and follow the tutorial":

- Source: https://vm.tiktok.com/ZGdHggUDC/
- Resolved video: https://www.tiktok.com/@studio.kashi/video/7617655149653167390
- Creator: `@studio.kashi`
- TikTok title/description: "sharing my fav tutorials + how i learned ! ... #touchdesigner #design #art #tech #electronic"

The TikTok is not a single code tutorial for this React app. It is a quick learning-path video for TouchDesigner. The app is still a React/Vite web app, so the practical interpretation was: bring the visible TouchDesigner-style ideas into the existing browser canvas instead of converting the whole project to TouchDesigner.

## What The TikTok Shows

The video recommends a progression:

1. Download TouchDesigner from `derivative.ca`.
2. Start with white abstract visuals.
3. Next learn audio-reactive visuals, specifically bloom/particle-style output.
4. Then get into hand tracking.

The extracted local review frames were kept only in `tmp/tiktok-7617655149653167390/` as scratch evidence. Do not commit those unless the user explicitly wants the downloaded TikTok/frames stored in the repo.

## Goal For This Project

Make the current web app visibly closer to the TouchDesigner examples while keeping the existing installation concept:

```text
singing bowl sound + heartbeat + camera tracking + poem
```

The goal was not to add TouchDesigner as a dependency. The goal was to make the app visibly respond like a creative audiovisual system:

- white abstract visual texture
- audio-reactive bloom particles
- visible hand/body tracking cues
- stronger proof that mic/camera data affect the stage

## What Was Implemented

### White Abstract Visuals

`src/components/CameraStage.tsx` now draws a white line field while the bowl session is active.

This is the web-app version of the TikTok's "start with visuals" step.

### Audio-Reactive Bloom Particles

`src/components/CameraStage.tsx` now draws particle blooms around the body center.

The particles react to:

- mic bars
- frequency peaks
- heartbeat pulse
- detected chakra color

This is the web-app version of the TikTok's audio-reactive/bloom visual step.

### Hand / Body Tracking

`src/camera/usePoseTracking.ts` now exposes wrist anchors:

- `leftWrist`
- `rightWrist`

`src/components/CameraStage.tsx` draws tracking rings and connecting lines for wrists, shoulders, and head.

This is the web-app version of the TikTok's hand-tracking step.

### Visible Chakra / Frequency Status

When the microphone detects a chakra, the stage status can show the chakra name and approximate frequency, such as:

```text
Heart 639 Hz
```

This makes the teammate sound-analysis work easier to explain during a demo.

## Files Changed For This Pass

- `src/types.ts`: added wrist anchors to `TrackingAnchors`.
- `src/camera/usePoseTracking.ts`: maps MediaPipe wrist landmarks into tracking anchors.
- `src/components/CameraStage.tsx`: adds white visual field, bloom particles, tracking nodes, and chakra/frequency status.
- `src/App.tsx`: passes chakra name and dominant frequency into the stage.
- `src/components/CameraStage.test.tsx`: updates canvas expectations now that line strokes are intentional.
- `README.md`: mentions TouchDesigner-inspired stage visuals.
- `docs/current-status.md`: records current behavior.
- `docs/ai-handoff.md`: records AI takeover context.

## What To Tell The Group

Short version:

```text
We used the TouchDesigner reference as visual direction, but built the same ideas directly into our web app.
```

Slightly fuller version:

```text
The TikTok suggested learning TouchDesigner through white visuals, audio-reactive particles, and hand tracking. Instead of rebuilding the whole project in TouchDesigner, we translated those ideas into our React canvas: the stage now has white abstract visuals, audio-reactive bloom particles, and visible wrist/body tracking.
```

## Remaining Risk

The visual layer is implemented, but it still needs real camera/microphone testing in the demo room.

Things to check manually:

- Wrist tracking appears when hands are visible.
- Bloom particles feel clearly audio-reactive.
- White visual field is visible but not too distracting.
- Chakra/frequency text appears when the bowl tone is strong.
- Performance is smooth on the laptop used for the presentation.

## Next Useful Polish

If the visuals still look too subtle, increase these in `src/components/CameraStage.tsx`:

- white field opacity in `drawWhiteVisualField`
- bloom particle count or alpha in `drawAudioBloomParticles`
- tracking ring radius/alpha in `drawTrackingNodes`

If tracking feels unstable, tune MediaPipe confidence in `src/camera/usePoseTracking.ts`.
