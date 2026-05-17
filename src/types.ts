export type ChakraInfo = {
  name: string
  frequency: number
  color: string
}

export type HeartbeatTrend = 'calming' | 'stable' | 'rising'

export type HeartbeatFeatures = {
  bpm: number
  trend: HeartbeatTrend
  variability: number
  dominantChakra: ChakraInfo | null
}

export type AudioFeatures = {
  averageEnergy: number
  peakEnergy: number
  bass: number
  mids: number
  treble: number
  pulseBpm: number | null
  dominantChakra: ChakraInfo | null
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
