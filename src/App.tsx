import { Activity, Heart, Mic, MicOff, Waves } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useHeartbeat } from './audio/useHeartbeat'
import { useMicInput } from './audio/useMicInput'
import { useCamera } from './camera/useCamera'
import { usePoseTracking } from './camera/usePoseTracking'
import { CameraStage } from './components/CameraStage'

const INACTIVITY_HIDE_MS = 3000

function App() {
  const mic = useMicInput()
  const heartbeat = useHeartbeat()
  const camera = useCamera()
  const tracking = usePoseTracking(camera.videoRef, camera.status)

  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetControlsHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), INACTIVITY_HIDE_MS)
  }, [])

  // Auto-hide controls after inactivity
  const showControls = useCallback(() => {
    setControlsVisible(true)
    resetControlsHideTimer()
  }, [resetControlsHideTimer])

  useEffect(() => {
    resetControlsHideTimer()
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
  }, [resetControlsHideTimer, showControls])

  // Session is active when the bowl mic is listening
  const isSessionActive = mic.isListening
  // Energy drives the aurora: heartbeat pulse when session is on, idle glow when off
  const liveEnergy = isSessionActive ? heartbeat.energy : 0.08

  const trendLabel = heartbeat.trend === 'calming' ? 'Slowing' : heartbeat.trend === 'rising' ? 'Rising' : 'Stable'
  const chakraLabel = mic.dominantChakra ? mic.dominantChakra.name : 'Listening'
  const frequencyLabel = mic.dominantFrequency ? `${Math.round(mic.dominantFrequency)} Hz` : 'Bowl'
  const signalLabel = isSessionActive ? chakraLabel : 'Idle'

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

        <div className="signal-display" aria-label={`Detected signal: ${signalLabel}`}>
          <Waves size={14} />
          <span>{signalLabel}</span>
        </div>

        <div className="signal-display quiet" aria-label={`Dominant frequency: ${frequencyLabel}`}>
          <Activity size={14} />
          <span>{frequencyLabel}</span>
        </div>
      </aside>

      <CameraStage
        anchors={tracking.anchors}
        bars={mic.bars}
        bpm={heartbeat.bpm}
        cameraStatus={camera.status}
        chakraColor={mic.dominantChakra?.color}
        chakraName={mic.dominantChakra?.name}
        dominantFrequency={mic.dominantFrequency}
        frequencyPeaks={mic.frequencyPeaks}
        heartbeatPulse={heartbeat.isBeating}
        isPlaying={isSessionActive}
        liveEnergy={liveEnergy}
        personDetected={tracking.personDetected}
        trackingStatus={tracking.trackingStatus}
        videoRef={camera.videoRef}
      />
    </main>
  )
}

export default App
