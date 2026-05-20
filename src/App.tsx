import { Check, Copy, Heart, Mic, MicOff, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { useHeartbeat } from './audio/useHeartbeat'
import { useMicInput } from './audio/useMicInput'
import { useCamera } from './camera/useCamera'
import { usePoseTracking } from './camera/usePoseTracking'
import { CameraStage } from './components/CameraStage'
import { requestPoem } from './poetry/poemClient'
import type { PoemResponse } from './types'

const seedPoem: PoemResponse = {
  lines: [
    'the bowl rings',
    'your pulse slows to meet it',
    'sound becomes body',
    'body becomes still',
    'in the resonance',
    'you are the instrument',
    'and the listening',
  ],
  moodWords: ['resonant', 'still', 'present'],
  palette: {
    primary: '#8ee8ff',
    accent: '#f4c979',
  },
}

const INACTIVITY_HIDE_MS = 3000

function App() {
  const mic = useMicInput()
  const heartbeat = useHeartbeat()
  const camera = useCamera()
  const tracking = usePoseTracking(camera.videoRef, camera.status)

  const [poem, setPoem] = useState<PoemResponse>(seedPoem)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-hide controls after inactivity
  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), INACTIVITY_HIDE_MS)
  }, [])

  useEffect(() => {
    showControls()
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown'] as const
    for (const event of events) {
      window.addEventListener(event, showControls, { passive: true })
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, showControls)
      }
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current)
    }
  }, [showControls])

  // Session is active when the bowl mic is listening
  const isSessionActive = mic.isListening
  // Energy drives the aurora: heartbeat pulse when session is on, idle glow when off
  const liveEnergy = isSessionActive ? heartbeat.energy : 0.08

  const generate = useCallback(async () => {
    setGenerationStatus('generating')
    setError('')
    setCopyStatus('idle')

    try {
      const nextPoem = await requestPoem({
        bpm: heartbeat.bpm,
        trend: heartbeat.trend,
        variability: heartbeat.variability,
        dominantChakra: null, // filled once bowl chakra detection is wired to hardware
      })
      setPoem(nextPoem)
      setGenerationStatus('ready')
    } catch (generateError) {
      setGenerationStatus('error')
      setError(generateError instanceof Error ? generateError.message : 'Poetry generation failed.')
    }
  }, [heartbeat.bpm, heartbeat.trend, heartbeat.variability])

  const generationLabel = useMemo(() => {
    if (generationStatus === 'ready') return 'Poem ready'
    if (generationStatus === 'generating') return 'Generating'
    if (generationStatus === 'error') return error.includes('API_KEY') ? 'Needs API key' : 'Try again'
    return 'Ready'
  }, [error, generationStatus])

  const copyPoem = useCallback(async () => {
    const poemText = poem.lines.join('\n')

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(poemText)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = poemText
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.append(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }

      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }, [poem.lines])

  useEffect(() => {
    if (copyStatus === 'idle') {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setCopyStatus('idle'), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [copyStatus])

  const trendLabel = heartbeat.trend === 'calming' ? 'Slowing' : heartbeat.trend === 'rising' ? 'Rising' : 'Stable'

  return (
    <main className="app-shell">
      <aside className={`control-rail${controlsVisible ? '' : ' hidden'}`} aria-label="Controls">
        <div className="brand">CBL</div>

        <button
          className={`mic-button${mic.isListening ? ' active' : ''}`}
          type="button"
          aria-label={mic.isListening ? 'Stop bowl microphone' : 'Start bowl microphone'}
          onClick={mic.toggle}
        >
          {mic.isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <div
          className={`heartbeat-display${heartbeat.isBeating ? ' beat' : ''}`}
          aria-live="polite"
          aria-label={`Heart rate: ${heartbeat.bpm} BPM`}
        >
          <Heart size={14} />
          <span className="bpm-value">{heartbeat.bpm}</span>
        </div>

        <p className="trend-label">{trendLabel}</p>

        <button
          className="generate-poem-button"
          type="button"
          aria-label="Generate poem"
          disabled={generationStatus === 'generating'}
          onClick={generate}
        >
          <RefreshCw size={16} />
        </button>

        <p className="micro-label" aria-live="polite">{generationLabel}</p>
      </aside>

      <CameraStage
        anchors={tracking.anchors}
        bars={mic.bars}
        bpm={heartbeat.bpm}
        cameraStatus={camera.status}
        heartbeatPulse={heartbeat.isBeating}
        isPlaying={isSessionActive}
        liveEnergy={liveEnergy}
        personDetected={tracking.personDetected}
        poemLines={poem.lines}
        trackingStatus={tracking.trackingStatus}
        videoRef={camera.videoRef}
      />

      <aside className={`poem-panel${controlsVisible ? '' : ' hidden'}`} aria-label="Poem">
        <header>
          <h2>Poem</h2>
          <div className="poem-actions">
            <button type="button" aria-label="Regenerate poem" onClick={generate}>
              <RefreshCw size={18} />
            </button>
            <button type="button" aria-label={copyStatus === 'copied' ? 'Poem copied' : 'Copy poem'} onClick={copyPoem}>
              {copyStatus === 'copied' ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </header>

        {error ? <p className="error-message" role="alert">{error}</p> : null}
        {copyStatus !== 'idle' ? (
          <p className={`copy-status ${copyStatus}`} role="status">
            {copyStatus === 'copied' ? 'Copied' : 'Copy failed'}
          </p>
        ) : null}

        <ol className="poem-lines">
          {poem.lines.map((line, index) => (
            <li key={`${line}-${index}`}>
              <span className="timeline-dot" />
              <p>{line}</p>
            </li>
          ))}
        </ol>

        <div className="listening-pill">
          <span className={`status-dot ${isSessionActive ? 'active' : ''}`} />
          {isSessionActive ? 'Bowl session active' : 'Idle'}
        </div>
      </aside>
    </main>
  )
}

export default App
