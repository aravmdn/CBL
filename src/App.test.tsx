import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

class FakeAudioElement extends EventTarget {
  currentTime = 0
  duration = 48
  paused = true
  preload = ''
  crossOrigin: string | null = null
  src: string
  volume = 0.72

  constructor(src: string) {
    super()
    this.src = src
  }

  load() {
    this.dispatchEvent(new Event('loadedmetadata'))
  }

  async play() {
    this.paused = false
    this.dispatchEvent(new Event('play'))
  }

  pause() {
    this.paused = true
    this.dispatchEvent(new Event('pause'))
  }
}

class FakeAudioContext {
  state = 'running'
  destination = {}

  async resume() {
    this.state = 'running'
  }

  createAnalyser() {
    return {
      fftSize: 128,
      frequencyBinCount: 64,
      smoothingTimeConstant: 0.84,
      connect: vi.fn(),
      getByteFrequencyData: (data: Uint8Array) => data.fill(64),
    }
  }

  createMediaElementSource() {
    return {
      connect: vi.fn(),
    }
  }

  async decodeAudioData() {
    const samples = new Float32Array(8000)
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.sin((2 * Math.PI * 220 * index) / 8000) * 0.3
    }

    return {
      duration: 1,
      sampleRate: 8000,
      numberOfChannels: 1,
      getChannelData: () => samples,
    }
  }
}

const stream = {
  getVideoTracks: () => [{ label: 'HD Pro Webcam C920' }],
  getTracks: () => [{ stop: vi.fn() }],
}

let writeClipboardText = vi.fn(async () => undefined)

function installCanvasMock() {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    addColorStop: vi.fn(),
    arc: vi.fn(),
    bezierCurveTo: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
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
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext
}

beforeEach(() => {
  writeClipboardText = vi.fn(async () => undefined)
  vi.stubGlobal('Audio', FakeAudioElement)
  vi.stubGlobal('AudioContext', FakeAudioContext)
  vi.stubGlobal('webkitAudioContext', FakeAudioContext)
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/poem') {
      return new Response(
        JSON.stringify({
          lines: ['first light', 'finds the room', 'under your breath', 'the sample turns', 'into weather'],
          moodWords: ['soft', 'bright'],
          palette: { primary: '#8ee8ff', accent: '#f4c979' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(new ArrayBuffer(8), { status: 200 })
  }))
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: {
      getUserMedia: vi.fn(async () => stream),
    },
    clipboard: {
      writeText: writeClipboardText,
    },
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
    configurable: true,
    value: null,
    writable: true,
  })
  HTMLMediaElement.prototype.play = vi.fn(async () => undefined)
  installCanvasMock()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders the prototype shell and granted camera state', async () => {
    render(<App />)

    expect(screen.getByText('CBL')).toBeInTheDocument()
    expect(screen.getByText('Sample')).toBeInTheDocument()
    expect(screen.getAllByText('Generate').length).toBeGreaterThan(0)
    expect(screen.getByText('Camera')).toBeInTheDocument()
    expect(screen.getByText('Poem')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Granted')).toBeInTheDocument())
  })

  it('shows a denied camera state without crashing', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => {
          throw new Error('denied')
        }),
      },
    })

    render(<App />)

    await waitFor(() => expect(screen.getByText('Denied')).toBeInTheDocument())
  })

  it('generates and displays a poem from the API', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Generate' }))

    await waitFor(() => expect(screen.getByText('first light')).toBeInTheDocument())
    expect(screen.getByText('Poem ready')).toBeInTheDocument()
  })

  it('supports sample transport controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Skip sample forward 10 seconds' }))
    expect(screen.getByText('00:10')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restart sample' }))
    expect(screen.getAllByText('00:00').length).toBeGreaterThan(0)
  })

  it('copies the current poem to the clipboard', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Copy poem' }))

    await expect(navigator.clipboard.readText()).resolves.toContain('a quiet bloom')
    expect(screen.getByRole('status')).toHaveTextContent('Copied')
  })

  it('renders a clear API error state', async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/poem') {
        return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY or OPENAI_API_KEY is not set.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(new ArrayBuffer(8), { status: 200 })
    })

    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Generate' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('OPENROUTER_API_KEY'))
    expect(screen.getByText('Needs API key')).toBeInTheDocument()
  })
})
