import type { AudioFeatures, ChakraInfo } from '../types'

export const CHAKRAS: ReadonlyArray<ChakraInfo> = [
  { name: 'Root',         frequency: 396, color: '#ff0000' },
  { name: 'Sacral',       frequency: 417, color: '#ff7f00' },
  { name: 'Solar Plexus', frequency: 528, color: '#ffff00' },
  { name: 'Heart',        frequency: 639, color: '#00ff00' },
  { name: 'Throat',       frequency: 741, color: '#007fff' },
  { name: 'Third Eye',    frequency: 852, color: '#4b0082' },
  { name: 'Crown',        frequency: 963, color: '#9400d3' },
]

export function findNearestChakra(frequency: number): ChakraInfo {
  return CHAKRAS.reduce((nearest, chakra) =>
    Math.abs(chakra.frequency - frequency) < Math.abs(nearest.frequency - frequency) ? chakra : nearest,
  )
}

export type AudioBufferLike = {
  sampleRate: number
  duration: number
  numberOfChannels: number
  getChannelData(channel: number): Float32Array
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

function goertzelMagnitude(samples: Float32Array, start: number, size: number, sampleRate: number, frequency: number) {
  const normalized = frequency / sampleRate
  const coefficient = 2 * Math.cos(2 * Math.PI * normalized)
  let previous = 0
  let previous2 = 0

  for (let index = 0; index < size; index += 1) {
    const sample = samples[start + index] ?? 0
    const current = sample + coefficient * previous - previous2
    previous2 = previous
    previous = current
  }

  return Math.sqrt(previous2 * previous2 + previous * previous - coefficient * previous * previous2) / size
}

function estimatePulseBpm(samples: Float32Array, sampleRate: number) {
  const frameSize = Math.max(256, Math.floor(sampleRate / 20))
  const envelope: number[] = []

  for (let start = 0; start + frameSize < samples.length; start += frameSize) {
    let sum = 0
    for (let index = start; index < start + frameSize; index += 1) {
      sum += Math.abs(samples[index])
    }
    envelope.push(sum / frameSize)
  }

  if (envelope.length < 8) {
    return null
  }

  const mean = envelope.reduce((sum, value) => sum + value, 0) / envelope.length
  const variance = envelope.reduce((sum, value) => sum + (value - mean) ** 2, 0) / envelope.length
  const threshold = mean + Math.sqrt(variance) * 0.35
  const minFramesBetweenPeaks = Math.floor(0.28 / (frameSize / sampleRate))
  const peaks: number[] = []

  for (let index = 1; index < envelope.length - 1; index += 1) {
    if (envelope[index] > threshold && envelope[index] > envelope[index - 1] && envelope[index] >= envelope[index + 1]) {
      if (peaks.length === 0 || index - peaks[peaks.length - 1] >= minFramesBetweenPeaks) {
        peaks.push(index)
      }
    }
  }

  if (peaks.length < 3) {
    return null
  }

  const intervals = peaks.slice(1).map((peak, index) => (peak - peaks[index]) * (frameSize / sampleRate))
  const averageInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length
  const bpm = Math.round(60 / averageInterval)

  return bpm >= 45 && bpm <= 180 ? bpm : null
}

export function analyzeSamples(channels: Float32Array[], sampleRate: number, durationSec: number): AudioFeatures {
  const length = Math.min(...channels.map((channel) => channel.length))
  const mixed = new Float32Array(length)

  for (let index = 0; index < length; index += 1) {
    let sum = 0
    for (const channel of channels) {
      sum += channel[index] ?? 0
    }
    mixed[index] = sum / channels.length
  }

  let sumSquares = 0
  let peak = 0
  for (let index = 0; index < mixed.length; index += 1) {
    const sample = mixed[index]
    sumSquares += sample * sample
    peak = Math.max(peak, Math.abs(sample))
  }

  const frameSize = Math.min(2048, Math.max(512, Math.floor(sampleRate / 20)))
  const step = frameSize * 2
  const maxFrames = 90
  const bassFrequencies = [85, 140, 220]
  const midFrequencies = [440, 880, 1600]
  const trebleFrequencies = [3200, 5200, 7600]
  let bass = 0
  let mids = 0
  let treble = 0
  let frames = 0
  const chakraSums = new Array<number>(CHAKRAS.length).fill(0)

  for (let start = 0; start + frameSize < mixed.length && frames < maxFrames; start += step) {
    bass += bassFrequencies.reduce((sum, frequency) => sum + goertzelMagnitude(mixed, start, frameSize, sampleRate, frequency), 0)
    mids += midFrequencies.reduce((sum, frequency) => sum + goertzelMagnitude(mixed, start, frameSize, sampleRate, frequency), 0)
    treble += trebleFrequencies.reduce((sum, frequency) => sum + goertzelMagnitude(mixed, start, frameSize, sampleRate, frequency), 0)
    for (let i = 0; i < CHAKRAS.length; i += 1) {
      chakraSums[i] += goertzelMagnitude(mixed, start, frameSize, sampleRate, CHAKRAS[i].frequency)
    }
    frames += 1
  }

  const totalBandEnergy = bass + mids + treble || 1
  const rms = Math.sqrt(sumSquares / Math.max(1, mixed.length))

  const dominantChakraIdx = chakraSums.reduce((best, val, i) => (val > chakraSums[best] ? i : best), 0)
  const dominantChakra = CHAKRAS[dominantChakraIdx]

  return {
    averageEnergy: clamp01(rms * 2.4),
    peakEnergy: clamp01(peak),
    bass: clamp01(bass / totalBandEnergy),
    mids: clamp01(mids / totalBandEnergy),
    treble: clamp01(treble / totalBandEnergy),
    pulseBpm: estimatePulseBpm(mixed, sampleRate || Math.round(mixed.length / durationSec)),
    dominantChakra,
  }
}

export function analyzeAudioBuffer(buffer: AudioBufferLike): AudioFeatures {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_item, index) => buffer.getChannelData(index))
  return analyzeSamples(channels, buffer.sampleRate, buffer.duration)
}
