import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

class FakeAudioContext {
  state = 'running'
  destination = {}
  sampleRate = 44_100

  async resume() {
    this.state = 'running'
  }

  async close() {
    this.state = 'closed'
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      maxDecibels: -20,
      minDecibels: -90,
      smoothingTimeConstant: 0.84,
      connect: vi.fn(),
      getFloatFrequencyData: (data: Float32Array) => {
        data.fill(-90)
        data[24] = -28
        data[25] = -24
        data[26] = -29
      },
    }
  }

  createMediaStreamSource() {
    return { connect: vi.fn() }
  }
}

const track = { stop: vi.fn() }
const stream = {
  getVideoTracks: () => [{ label: 'HD Pro Webcam C920' }],
  getTracks: () => [track],
}

function installCanvasMock() {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    addColorStop: vi.fn(),
    arc: vi.fn(),
    bezierCurveTo: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    closePath: vi.fn(),
    createImageData: (width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      height,
      width,
    }),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    drawImage: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    putImageData: vi.fn(),
    quadraticCurveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext
}

beforeEach(() => {
  vi.stubGlobal('AudioContext', FakeAudioContext)
  vi.stubGlobal('webkitAudioContext', FakeAudioContext)
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: {
      getUserMedia: vi.fn(async () => stream),
    },
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
    configurable: true,
    value: null,
    writable: true,
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'videoWidth', {
    configurable: true,
    value: 0,
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'videoHeight', {
    configurable: true,
    value: 0,
  })
  HTMLMediaElement.prototype.play = vi.fn(async () => undefined)
  installCanvasMock()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders the visual installation shell without active poetry controls', () => {
    render(<App />)

    expect(screen.getByText('CBL')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start bowl microphone' })).toBeInTheDocument()
    expect(screen.getByLabelText('Camera visual effects stage')).toBeInTheDocument()
    expect(screen.queryByText('Poem')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /poem/i })).not.toBeInTheDocument()
  })

  it('starts the bowl microphone and shows signal status', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Start bowl microphone' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Stop bowl microphone' })).toBeInTheDocument())
    expect(screen.getByLabelText(/Detected signal:/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Dominant frequency:/)).toBeInTheDocument()
  })

  it('shows a denied camera state without crashing', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async (constraints: MediaStreamConstraints) => {
          if (constraints.video) {
            throw new Error('denied')
          }
          return stream
        }),
      },
    })

    render(<App />)

    await waitFor(() => expect(screen.getByText('Camera fallback')).toBeInTheDocument())
  })
})
