import { useEffect, useRef, useState } from 'react'
import type { HeartbeatTrend } from '../types'

export type HeartbeatState = {
  bpm: number
  isBeating: boolean
  energy: number
  trend: HeartbeatTrend
  variability: number
  // When hardware arrives: swap the useEffect body to read from Web Serial API
  // and set mode to 'sensor'. The rest of the app uses this state unchanged.
  mode: 'simulated' | 'sensor'
}

const BEAT_FLASH_MS = 60

export function useHeartbeat(): HeartbeatState {
  const [state, setState] = useState<HeartbeatState>({
    bpm: 72,
    isBeating: false,
    energy: 0.1,
    trend: 'stable',
    variability: 0.3,
    mode: 'simulated',
  })

  const baseBpmRef = useRef(70 + Math.random() * 6)
  const bpmHistoryRef = useRef<number[]>([])
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    let beatTimeout: ReturnType<typeof setTimeout> | null = null
    let flashTimeout: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    function beat() {
      if (cancelled) return

      // Bowl calming: BPM drifts down by up to 8 over 3 minutes of exposure
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const calm = Math.min(elapsed / 180, 1) * 8
      const base = baseBpmRef.current - calm

      // Realistic HRV: ±5% interval jitter per beat
      const interval = 60000 / base
      const jitter = interval * 0.05 * (Math.random() * 2 - 1)
      const nextInterval = Math.max(380, interval + jitter)
      const currentBpm = Math.round(60000 / nextInterval)

      bpmHistoryRef.current.push(currentBpm)
      if (bpmHistoryRef.current.length > 20) bpmHistoryRef.current.shift()

      const history = bpmHistoryRef.current
      const trend: HeartbeatTrend =
        history.length < 8
          ? 'stable'
          : (() => {
              const recent = history.slice(-4).reduce((a, b) => a + b, 0) / 4
              const older = history.slice(-8, -4).reduce((a, b) => a + b, 0) / 4
              const delta = recent - older
              if (delta < -1.5) return 'calming'
              if (delta > 1.5) return 'rising'
              return 'stable'
            })()

      const recentBpms = history.slice(-10)
      const mean = recentBpms.reduce((a, b) => a + b, 0) / recentBpms.length
      const variance = recentBpms.reduce((a, b) => a + (b - mean) ** 2, 0) / recentBpms.length
      const variability = Math.min(1, Math.sqrt(variance) / 6)

      // Coarse energy step only — the canvas derives its own smooth per-frame
      // envelope from the beat pulse, so we avoid a 60fps setState here.
      setState({ bpm: currentBpm, isBeating: true, energy: 1.0, trend, variability, mode: 'simulated' })

      flashTimeout = setTimeout(() => {
        if (!cancelled) setState((prev) => ({ ...prev, isBeating: false, energy: 0.55 }))
      }, BEAT_FLASH_MS)

      beatTimeout = setTimeout(beat, nextInterval)
    }

    beatTimeout = setTimeout(beat, 600)

    return () => {
      cancelled = true
      if (beatTimeout !== null) clearTimeout(beatTimeout)
      if (flashTimeout !== null) clearTimeout(flashTimeout)
    }
  }, [])

  return state
}
