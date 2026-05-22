import { useCallback, useRef, useState } from 'react'
import { findNearestChakra } from './audioAnalysis'
import type { ChakraInfo, FrequencyPeak } from '../types'

const BAR_COUNT = 40
const FFT_SIZE = 2048
const TOP_PEAK_COUNT = 8
const MIN_PEAK_FREQUENCY = 80
const MAX_PEAK_FREQUENCY = 1600
const PEAK_SPACING_HZ = 32
const MIN_DOMINANT_MAGNITUDE = 0.08

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const createSilentBars = () => Array.from({ length: 40 }, () => 0)

function normalizeDecibel(value: number, minDecibels: number, maxDecibels: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return clamp01((value - minDecibels) / (maxDecibels - minDecibels))
}

function createBars(magnitudes: number[], sampleRate: number, fftSize: number) {
  const maxFrequency = 2000
  const maxBin = Math.min(magnitudes.length, Math.max(1, Math.floor((maxFrequency * fftSize) / sampleRate)))
  const binsPerBar = Math.max(1, Math.floor(maxBin / BAR_COUNT))

  return Array.from({ length: BAR_COUNT }, (_item, barIndex) => {
    const start = barIndex * binsPerBar
    const end = barIndex === BAR_COUNT - 1 ? maxBin : Math.min(maxBin, start + binsPerBar)
    let sum = 0
    for (let index = start; index < end; index += 1) {
      sum += magnitudes[index] ?? 0
    }

    return Math.max(0.04, sum / Math.max(1, end - start))
  })
}

function findTopPeaks(magnitudes: number[], sampleRate: number, fftSize: number): FrequencyPeak[] {
  const candidates: FrequencyPeak[] = []

  for (let index = 1; index < magnitudes.length - 1; index += 1) {
    const frequency = (index * sampleRate) / fftSize
    if (frequency < MIN_PEAK_FREQUENCY || frequency > MAX_PEAK_FREQUENCY) {
      continue
    }

    const magnitude = magnitudes[index]
    if (magnitude < magnitudes[index - 1] || magnitude < magnitudes[index + 1]) {
      continue
    }

    candidates.push({ frequency, magnitude })
  }

  const selected: FrequencyPeak[] = []
  for (const candidate of candidates.sort((a, b) => b.magnitude - a.magnitude)) {
    const tooClose = selected.some((peak) => Math.abs(peak.frequency - candidate.frequency) < PEAK_SPACING_HZ)
    if (!tooClose) {
      selected.push(candidate)
    }
    if (selected.length === TOP_PEAK_COUNT) {
      break
    }
  }

  return selected
}

export function useMicInput() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [liveEnergy, setLiveEnergy] = useState(0)
  const [bars, setBars] = useState(createSilentBars)
  const [frequencyPeaks, setFrequencyPeaks] = useState<FrequencyPeak[]>([])
  const [dominantFrequency, setDominantFrequency] = useState<number | null>(null)
  const [dominantChakra, setDominantChakra] = useState<ChakraInfo | null>(null)

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
    setFrequencyPeaks([])
    setDominantFrequency(null)
    setDominantChakra(null)
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
      analyser.fftSize = FFT_SIZE
      analyser.minDecibels = -90
      analyser.maxDecibels = -20
      analyser.smoothingTimeConstant = 0.84
      context.createMediaStreamSource(stream).connect(analyser)
      analyserRef.current = analyser

      setIsListening(true)

      const tick = () => {
        const frequencyData = new Float32Array(analyser.frequencyBinCount)
        analyser.getFloatFrequencyData(frequencyData)
        const normalized = Array.from(frequencyData, (value) => normalizeDecibel(value, analyser.minDecibels, analyser.maxDecibels))
        const average = normalized.reduce((sum, value) => sum + value, 0) / Math.max(1, normalized.length)
        const peaks = findTopPeaks(normalized, context.sampleRate, analyser.fftSize)
        const dominant = peaks[0]

        setLiveEnergy(average)
        setBars(createBars(normalized, context.sampleRate, analyser.fftSize))
        setFrequencyPeaks(peaks)
        setDominantFrequency(dominant && dominant.magnitude >= MIN_DOMINANT_MAGNITUDE ? dominant.frequency : null)
        setDominantChakra(dominant && dominant.magnitude >= MIN_DOMINANT_MAGNITUDE ? findNearestChakra(dominant.frequency) : null)
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

  return { bars, dominantChakra, dominantFrequency, frequencyPeaks, isListening, liveEnergy, start, stop, toggle }
}
