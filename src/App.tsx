import { Camera, Check, Copy, Feather, Pause, Play, RefreshCw, SkipBack, SkipForward, Sparkles, Volume2, Waves } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { useAudioSample } from './audio/useAudioSample'
import { useCamera } from './camera/useCamera'
import { usePoseTracking } from './camera/usePoseTracking'
import { CameraStage } from './components/CameraStage'
import { requestPoem } from './poetry/poemClient'
import type { PoemResponse } from './types'

const sampleUrl = '/audio/luminous-drift.wav'

const seedPoem: PoemResponse = {
  lines: [
    'a quiet bloom',
    'behind the noise',
    'your breath teaches the night',
    'how to soften',
    'light learns your name',
    'and in this listening',
    'we come home',
  ],
  moodWords: ['luminous', 'soft', 'near'],
  palette: {
    primary: '#8ee8ff',
    accent: '#f4c979',
  },
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function App() {
  const audio = useAudioSample(sampleUrl)
  const camera = useCamera()
  const tracking = usePoseTracking(camera.videoRef, camera.status)
  const [poem, setPoem] = useState<PoemResponse>(seedPoem)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [hasRequestedPoem, setHasRequestedPoem] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const progress = useMemo(() => {
    if (audio.duration <= 0) {
      return 0
    }

    return Math.min(100, (audio.currentTime / audio.duration) * 100)
  }, [audio.currentTime, audio.duration])

  const generate = useCallback(async () => {
    setGenerationStatus('generating')
    setError('')
    setCopyStatus('idle')

    try {
      const features = await audio.analyzeSample()
      const nextPoem = await requestPoem(features, audio.duration || 48)
      setPoem(nextPoem)
      setGenerationStatus('ready')
      setHasRequestedPoem(true)
    } catch (generateError) {
      setGenerationStatus('error')
      setError(generateError instanceof Error ? generateError.message : 'Poetry generation failed.')
      setHasRequestedPoem(true)
    }
  }, [audio])

  const generationLabel = useMemo(() => {
    if (generationStatus === 'ready') {
      return 'Poem ready'
    }

    if (generationStatus === 'generating') {
      return 'Listening'
    }

    if (generationStatus === 'error') {
      return error.includes('API_KEY') ? 'Needs API key' : 'Try again'
    }

    return 'Ready'
  }, [error, generationStatus])

  const togglePlayback = useCallback(async () => {
    const shouldGenerate = !audio.isPlaying && !hasRequestedPoem
    await audio.togglePlayback()

    if (shouldGenerate) {
      void generate()
    }
  }, [audio, generate, hasRequestedPoem])

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

  return (
    <main className="app-shell">
      <aside className="control-rail" aria-label="Controls">
        <div className="brand">CBL</div>

        <section className="rail-section">
          <h2>
            <Waves size={18} />
            Sample
          </h2>
          <div className="select-button static-control" aria-label="Selected sample">
            <span>Luminous Drift</span>
          </div>
          <div className="time-row">
            <span>{formatTime(audio.currentTime)}</span>
            <span>{formatTime(audio.duration || 48)}</span>
          </div>
          <div className="progress-track" aria-label="Sample progress">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="transport" aria-label="Sample transport controls">
            <button type="button" aria-label="Restart sample" onClick={audio.restart}>
              <SkipBack size={22} />
            </button>
            <button className="play-button" type="button" aria-label={audio.isPlaying ? 'Pause sample' : 'Play sample'} onClick={togglePlayback}>
              {audio.isPlaying ? <Pause size={26} /> : <Play size={26} />}
            </button>
            <button type="button" aria-label="Skip sample forward 10 seconds" onClick={() => audio.seekBy(10)}>
              <SkipForward size={22} />
            </button>
          </div>

          <label className="volume-row">
            <Volume2 size={18} />
            <input
              aria-label="Volume"
              max="1"
              min="0"
              onChange={(event) => audio.setVolume(Number(event.target.value))}
              step="0.01"
              type="range"
              value={audio.volume}
            />
          </label>
        </section>

        <section className="rail-section">
          <h2>
            <RefreshCw size={18} />
            Generate
          </h2>
          <button className="generate-button" disabled={generationStatus === 'generating'} onClick={generate} type="button">
            <Sparkles size={18} />
            {generationStatus === 'generating' ? 'Listening' : 'Generate'}
          </button>
          <p className="micro-label">{generationLabel}</p>
          <div className="mini-bars" aria-hidden="true">
            {audio.bars.slice(0, 16).map((bar, index) => (
              <span key={index} style={{ height: `${8 + bar * 20}px` }} />
            ))}
          </div>
        </section>

        <section className="rail-section">
          <h2>
            <Camera size={18} />
            Camera
          </h2>
          <div className="select-button static-control" aria-label="Selected camera">
            <span>{camera.label}</span>
          </div>
          <div className="permission-row">
            <span>Permission</span>
            <strong className={camera.status === 'granted' ? 'granted' : ''}>
              {camera.status === 'granted' ? 'Granted' : camera.status === 'pending' ? 'Pending' : 'Denied'}
            </strong>
          </div>
        </section>

        <p className="tip">Tip: Keep the sample playing for richer visuals and poetry.</p>

      </aside>

      <CameraStage
        anchors={tracking.anchors}
        bars={audio.bars}
        cameraStatus={camera.status}
        isPlaying={audio.isPlaying}
        liveEnergy={audio.liveEnergy}
        personDetected={tracking.personDetected}
        trackingStatus={tracking.trackingStatus}
        videoRef={camera.videoRef}
      />

      <aside className="poem-panel" aria-label="Poem">
        <header>
          <h2>
            <Feather size={20} />
            Poem
          </h2>
          <div className="poem-actions">
            <button type="button" aria-label={audio.isPlaying ? 'Pause sample' : 'Play sample'} onClick={togglePlayback}>
              {audio.isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
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
          <span className={`status-dot ${audio.isPlaying ? 'active' : ''}`} />
          Listening
        </div>
      </aside>
    </main>
  )
}

export default App
