# MATLAB Sound Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

> Status update, 2026-05-25: this is now a historical implementation plan. The sound/chakra/cymatics work was integrated, but poetry has since been removed from the active app and kept only as dormant legacy code.

**Goal:** Translate the teammate MATLAB sound-analysis idea into the web app so live bowl sound drives chakra detection, cymatics visuals, and, originally, poem context.

**Architecture:** Keep the existing React/Vite app and canvas stage. Add browser-side FFT/top-frequency/chakra analysis in `useMicInput`, pass that data through `App`, and update the canvas cymatics renderer to use real frequencies. The poem API work described below is now legacy, not active product behavior.

**Tech Stack:** React 19, TypeScript, Vite, Web Audio API, Canvas 2D, Express, Vitest, Playwright.

---

### Legacy Task 1: Update Poem API Contract

This task was part of the older poetry direction. Do not use it as current product guidance.

**Files:**
- Modify: `src/types.ts`
- Modify: `src/poetry/poemClient.ts`
- Modify: `server/validation.ts`
- Modify: `server/openaiPoem.ts`
- Modify tests under `server/` and `src/`

**Steps:**
1. Add a `BowlMeditationRequest` type with `session: "bowl-meditation"` and `heartbeat`.
2. Make `requestPoem` send that type.
3. Make server validation accept the new type and validate BPM, trend, variability, and optional chakra.
4. Update the AI prompt to describe bowl/heartbeat/chakra state instead of `Luminous Drift`.
5. Update server tests to post the new shape.

### Task 2: Port Live Frequency And Chakra Analysis

**Files:**
- Modify: `src/audio/useMicInput.ts`
- Modify or add tests around audio analysis if needed

**Steps:**
1. Use a larger analyser FFT size closer to the MATLAB prototype.
2. Convert analyser bins into frequency/magnitude pairs.
3. Pick the strongest 8 bins.
4. Choose the nearest chakra from the teammate frequency table.
5. Return `topFrequencies`, `topMagnitudes`, `dominantFrequency`, and `dominantChakra`.

### Task 3: Wire Canvas Cymatics To Real Sound Data

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/CameraStage.tsx`
- Modify: `src/components/CameraStage.test.tsx`

**Steps:**
1. Pass mic frequency/chakra data into `CameraStage`.
2. Update cymatics drawing to use `k = frequency / 80`, matching teammate MATLAB logic.
3. Keep rendering artistic: transparent layer over the camera/aura scene, not a standalone graph.
4. Historical only: this used to pass `mic.dominantChakra` to the poem request. The active app now passes chakra only to the visual stage.

### Task 4: Update E2E And Docs

**Files:**
- Modify: `tests/e2e/cbl.spec.ts`
- Modify docs as needed

**Steps:**
1. Replace old sample-player expectations with current bowl-mic UI expectations.
2. Historical only: the active E2E test no longer mocks the poem route because the UI does not call it.
3. Verify the canvas is nonblank.
4. Update current-status docs after implementation.

### Verification

Run:

```powershell
npm run lint
npm run test
npm run build
npm run test:e2e
```
