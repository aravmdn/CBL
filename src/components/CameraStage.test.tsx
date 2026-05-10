import { act, render } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CameraStage } from './CameraStage'
import type { TrackingAnchors } from '../types'

const context = {
  arc: vi.fn(),
  bezierCurveTo: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  createLinearGradient: () => ({ addColorStop: vi.fn() }),
  createRadialGradient: () => ({ addColorStop: vi.fn() }),
  drawImage: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
}

const anchors: TrackingAnchors = {
  head: { x: 0.5, y: 0.24, confidence: 0.9 },
  leftShoulder: { x: 0.38, y: 0.42, confidence: 0.9 },
  rightShoulder: { x: 0.62, y: 0.42, confidence: 0.9 },
  torso: { x: 0.5, y: 0.58, confidence: 0.9 },
}

let frameCallback: FrameRequestCallback | null = null

function renderStage(personDetected: boolean, isPlaying: boolean) {
  return render(
    <CameraStage
      anchors={personDetected ? anchors : {}}
      bars={[0.3, 0.6, 0.4]}
      cameraStatus="granted"
      isPlaying={isPlaying}
      liveEnergy={0.5}
      personDetected={personDetected}
      poemLines={['first light', 'finds the room', 'under your breath', 'the sample turns', 'into weather']}
      trackingStatus={personDetected ? 'tracking' : 'seeking'}
      videoRef={createRef<HTMLVideoElement | null>()}
    />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  frameCallback = null
  HTMLCanvasElement.prototype.getContext = vi.fn(() => context) as unknown as typeof HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(
    () =>
      ({
        bottom: 720,
        height: 720,
        left: 0,
        right: 960,
        top: 0,
        width: 960,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  )
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frameCallback = callback
    return 1
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CameraStage aura effects', () => {
  it('does not draw poem text or effect strokes before a person is detected', () => {
    renderStage(false, true)

    act(() => {
      frameCallback?.(100)
    })

    expect(context.fillText).not.toHaveBeenCalled()
    expect(context.stroke).not.toHaveBeenCalled()
  })

  it('draws body-anchored aura and drifting poem text without line strokes after person detection and playback', () => {
    renderStage(true, true)

    act(() => {
      frameCallback?.(100)
    })

    expect(context.fillText).toHaveBeenCalled()
    expect(context.fill).toHaveBeenCalled()
    expect(context.stroke).not.toHaveBeenCalled()
  })
})
