import { useCallback, useRef, useState } from 'react'

const createSilentBars = () => Array.from({ length: 40 }, () => 0)

export function useMicInput() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [liveEnergy, setLiveEnergy] = useState(0)
  const [bars, setBars] = useState(createSilentBars)

  const stop = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
    setIsListening(false)
    setLiveEnergy(0)
    setBars(createSilentBars())
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      const AudioContextConstructor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const context = new AudioContextConstructor()
      audioContextRef.current = context

      const analyser = context.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.84
      context.createMediaStreamSource(stream).connect(analyser)
      analyserRef.current = analyser

      setIsListening(true)

      const tick = () => {
        const byteData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(byteData)
        const normalized = Array.from(byteData, (value) => value / 255)
        const average = normalized.reduce((sum, value) => sum + value, 0) / Math.max(1, normalized.length)
        setLiveEnergy(average)
        setBars(normalized.slice(0, 40).map((value) => Math.max(0.04, value)))
        animationRef.current = window.requestAnimationFrame(tick)
      }
      animationRef.current = window.requestAnimationFrame(tick)
      return true
    } catch {
      return false
    }
  }, [])

  const toggle = useCallback(async () => {
    if (isListening) {
      stop()
    } else {
      await start()
    }
  }, [isListening, start, stop])

  return { bars, isListening, liveEnergy, start, stop, toggle }
}
