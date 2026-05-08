export type AudioFeatures = {
  averageEnergy: number
  peakEnergy: number
  bass: number
  mids: number
  treble: number
  pulseBpm: number | null
}

export type PoemRequest = {
  sampleName: 'Luminous Drift'
  durationSec: number
  features: AudioFeatures
}

export type PoemResponse = {
  lines: string[]
  moodWords: string[]
  palette: {
    primary: string
    accent: string
  }
}

export type TrackingAnchor = {
  x: number
  y: number
  confidence: number
}

export type TrackingAnchors = {
  head?: TrackingAnchor
  leftShoulder?: TrackingAnchor
  rightShoulder?: TrackingAnchor
  torso?: TrackingAnchor
}

export type TrackingStatus = 'loading' | 'seeking' | 'tracking' | 'fallback'
