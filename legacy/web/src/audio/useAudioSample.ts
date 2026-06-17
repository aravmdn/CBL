import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeAudioBuffer } from './audioAnalysis'
import type { AudioFeatures } from '../types'

const fallbackFeatures: AudioFeatures = {
  averageEnergy: 0.36,
  peakEnergy: 0.72,
  bass: 0.34,
  mids: 0.42,
  treble: 0.24,
  pulseBpm: 84,
  dominantChakra: null,
}

const createSilentBars = () => Array.from({ length: 40 }, () => 0.08)

export function useAudioSample(sampleUrl: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceConnectedRef = useRef(false)
  const animationRef = useRef<number | null>(null)
  const featurePromiseRef = useRef<Promise<AudioFeatures> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.72)
  const [liveEnergy, setLiveEnergy] = useState(0)
  const [bars, setBars] = useState(createSilentBars)
  const [features, setFeatures] = useState<AudioFeatures | null>(null)

  const stopAnalyser = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const ensureAudioContext = useCallback(async () => {
    const audio = audioRef.current
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextConstructor || !audio) {
      return null
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor()
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    if (!sourceConnectedRef.current) {
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.84
      const source = audioContextRef.current.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(audioContextRef.current.destination)
      analyserRef.current = analyser
      sourceConnectedRef.current = true
    }

    return audioContextRef.current
  }, [])

  const analyzeSample = useCallback(async () => {
    if (features) {
      return features
    }

    if (featurePromiseRef.current) {
      return featurePromiseRef.current
    }

    featurePromiseRef.current = (async () => {
      try {
        const context = await ensureAudioContext()
        if (!context) {
          setFeatures(fallbackFeatures)
          return fallbackFeatures
        }

        const response = await fetch(sampleUrl)
        const arrayBuffer = await response.arrayBuffer()
        const decoded = await context.decodeAudioData(arrayBuffer.slice(0))
        const result = analyzeAudioBuffer(decoded)
        setFeatures(result)
        setDuration(decoded.duration)
        return result
      } catch {
        setFeatures(fallbackFeatures)
        return fallbackFeatures
      }
    })()

    return featurePromiseRef.current
  }, [ensureAudioContext, features, sampleUrl])

  const readAnalyser = useCallback(function tick() {
    const analyser = analyserRef.current
    if (!analyser) {
      return
    }

    const byteData = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(byteData)
    const normalized = Array.from(byteData, (value) => value / 255)
    const average = normalized.reduce((sum, value) => sum + value, 0) / Math.max(1, normalized.length)
    setLiveEnergy(average)
    setBars(normalized.slice(0, 40).map((value) => Math.max(0.04, value)))
    animationRef.current = window.requestAnimationFrame(tick)
  }, [])

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) {
      return fallbackFeatures
    }

    const result = await analyzeSample()
    await ensureAudioContext()
    await audio.play()
    setIsPlaying(true)
    animationRef.current = window.requestAnimationFrame(readAnalyser)
    return result
  }, [analyzeSample, ensureAudioContext, readAnalyser])

  const pause = useCallback(() => {
    const audio = audioRef.current
    audio?.pause()
    setIsPlaying(false)
    stopAnalyser()
  }, [stopAnalyser])

  const restart = useCallback(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.currentTime = 0
    setCurrentTime(0)

    if (!isPlaying) {
      setLiveEnergy(0)
      setBars(createSilentBars())
    }
  }, [isPlaying])

  const seekBy = useCallback(
    (seconds: number) => {
      const audio = audioRef.current
      if (!audio) {
        return
      }

      const mediaDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration
      const upperBound = mediaDuration > 0 ? mediaDuration : Number.POSITIVE_INFINITY
      const nextTime = Math.max(0, Math.min(upperBound, audio.currentTime + seconds))

      audio.currentTime = nextTime
      setCurrentTime(nextTime)
    },
    [duration],
  )

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      pause()
      return features ?? fallbackFeatures
    }

    return play()
  }, [features, isPlaying, pause, play])

  const setVolume = useCallback(
    (value: number) => {
      const nextVolume = Math.max(0, Math.min(1, value))
      setVolumeState(nextVolume)
      if (audioRef.current) {
        audioRef.current.volume = nextVolume
      }
    },
    [],
  )

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return undefined
    }

    const audio = new Audio(sampleUrl)
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'
    audio.volume = 0.72
    audioRef.current = audio

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => {
      setIsPlaying(false)
      setLiveEnergy(0)
      setBars(createSilentBars())
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.load()

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audioRef.current = null
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current)
      }
    }
  }, [sampleUrl])

  return {
    bars,
    currentTime,
    duration,
    features,
    isPlaying,
    liveEnergy,
    volume,
    analyzeSample,
    play,
    pause,
    restart,
    seekBy,
    setVolume,
    togglePlayback,
  }
}
