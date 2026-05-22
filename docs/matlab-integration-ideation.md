# MATLAB Integration Ideation

Date: 2026-05-22

## Plain Explanation

Your teammate's MATLAB work listens to the bowl and figures out what the sound is doing.

The web app should use that information to control the visuals.

Simple group explanation:

```text
MATLAB listens to the bowl.
The web app shows what the bowl is doing.
```

Slightly fuller group explanation:

```text
Our teammate made the sound-analysis part in MATLAB. We can bring that logic into the web app so the bowl sound controls the colors and patterns. The MATLAB work gives us the real sound data, and the web app turns that data into the final visual experience.
```

## What The Teammate Files Do

Source folder:

```text
EngineeringArt CBL/EngineeringArt CBL/
```

Files:

- `mic_input.m`: records a short live microphone frame and runs an FFT.
- `cymatics_pattern.m`: uses the strongest frequencies to make a cymatics pattern.
- `frequency_colours.csv`: maps chakra names/frequencies to RGB colors.
- `camera_input.m`: takes a webcam snapshot.
- `main.m`: runs the live MATLAB demo loop.

The camera part is already covered in the web app. The most useful pieces to integrate are microphone FFT, top frequencies, cymatics pattern, and chakra color mapping.

## Current Web App Compared To MATLAB

Current web app:

- Uses the microphone for basic visual bars.
- Has an artistic cymatics layer.
- Has chakra types in `audioAnalysis.ts`.
- Does not yet use real strongest bowl frequencies to drive the cymatics.
- Does not yet pass live chakra into the poem request.

Teammate MATLAB:

- Captures microphone audio.
- Calculates real frequencies and magnitudes.
- Picks the strongest frequencies.
- Builds a cymatics pattern from those frequencies.
- Colors the pattern using the nearest chakra frequency.

## Recommended Direction

Use an artistic integration, not a strict MATLAB copy.

This direction has now been implemented in the first integration pass.

That means:

- Keep the current aura/camera/poem scene.
- Use the teammate's sound logic underneath it.
- Make the result visually polished for the installation.
- Do not show a plain square MATLAB-style graph unless needed for debugging.

## What Would Change In Logic

Current simple flow:

```text
mic sound -> visual bars -> generic cymatics-like layer
```

Recommended flow:

```text
bowl sound
-> browser microphone
-> FFT frequency analysis
-> strongest 8 frequencies
-> nearest chakra color
-> cymatics pattern
-> aura tint and poem context
```

The teammate's main cymatics formula is:

```text
pattern += magnitude * sin(k * X) * sin(k * Y)
k = frequency / 80
```

In the web app, that formula can still be used, but drawn as a soft transparent layer over the person instead of as a standalone MATLAB image.

## What Would Change In Visuals

The app would still feel artistic, but it would be more connected to the real bowl sound.

Visual changes:

- The cymatics pattern changes based on the actual bowl frequencies.
- The pattern becomes more intense when the bowl sound is stronger.
- The color changes based on the closest chakra frequency.
- The aura can gently tint toward that chakra color.
- The poem can respond to the detected chakra.

Example:

```text
If the bowl sound is closest to 639 Hz:
-> the app detects Heart
-> cymatics become green-ish
-> aura can pick up green highlights
-> poem can reference openness, breath, or calm
```

## Exact Integration Points

### `src/audio/useMicInput.ts`

Live frequency analysis output has been added:

- `frequencies`
- `magnitudes`
- `topFrequencies`
- `dominantFrequency`
- `dominantChakra`

This is where `mic_input.m` should be translated.

### `src/components/CameraStage.tsx`

The cymatics layer now uses real frequency peaks and magnitudes, not just visual bar indexes.

This is where `cymatics_pattern.m` should be translated into canvas rendering.

### `src/App.tsx`

The live chakra from the microphone is now passed into:

- the canvas stage
- the poem request

`App` now uses the real value from `useMicInput`.

### `server/validation.ts` and `server/openaiPoem.ts`

The poem API now understands the new bowl meditation payload:

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

## What To Tell The Group

Short version:

```text
The MATLAB part analyzes the sound. The web app turns that analysis into the live visuals.
```

Medium version:

```text
Our teammate made a MATLAB prototype that listens to the bowl, finds the strongest frequencies, and chooses the closest chakra color. We can translate that same logic into the web app. Then the bowl sound will control the cymatics pattern, the aura color, and the poem context.
```

Visual explanation:

```text
Heartbeat = pulse of the aura
Bowl sound = shape and color of the cymatics
Camera = places the aura around the person
Poem = describes the body and sound state
```

## Why Artistic Integration Is Better Than A Direct Copy

A direct copy would look like a separate science graph.

An artistic version still uses the real sound logic, but makes it fit the installation:

- the pattern sits over the camera image
- the colors blend into the aura
- the poem and visuals feel like one scene
- the teammate's work is still present because the real sound controls the result

This is likely the strongest direction for the final presentation because it is both explainable and visually engaging.
