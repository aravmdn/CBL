import type { AudioFeatures, PoemRequest, PoemResponse } from '../src/types'
import { InvalidPoemRequestError, InvalidPoemResponseError } from './errors'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const readNumber = (value: unknown, label: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidPoemRequestError(`${label} must be a finite number.`)
  }

  return value
}

export function validateAudioFeatures(value: unknown): AudioFeatures {
  if (!value || typeof value !== 'object') {
    throw new InvalidPoemRequestError('features must be an object.')
  }

  const input = value as Record<string, unknown>
  const pulseBpm = input.pulseBpm

  if (pulseBpm !== null && pulseBpm !== undefined && (typeof pulseBpm !== 'number' || !Number.isFinite(pulseBpm))) {
    throw new InvalidPoemRequestError('features.pulseBpm must be a number or null.')
  }

  return {
    averageEnergy: clamp01(readNumber(input.averageEnergy, 'features.averageEnergy')),
    peakEnergy: clamp01(readNumber(input.peakEnergy, 'features.peakEnergy')),
    bass: clamp01(readNumber(input.bass, 'features.bass')),
    mids: clamp01(readNumber(input.mids, 'features.mids')),
    treble: clamp01(readNumber(input.treble, 'features.treble')),
    pulseBpm: pulseBpm === undefined ? null : pulseBpm,
    dominantChakra: null,
  }
}

export function validatePoemRequest(value: unknown): PoemRequest {
  if (!value || typeof value !== 'object') {
    throw new InvalidPoemRequestError('Request body must be an object.')
  }

  const input = value as Record<string, unknown>
  if (input.sampleName !== 'Luminous Drift') {
    throw new InvalidPoemRequestError('sampleName must be "Luminous Drift".')
  }

  const durationSec = readNumber(input.durationSec, 'durationSec')
  if (durationSec <= 0) {
    throw new InvalidPoemRequestError('durationSec must be greater than zero.')
  }

  return {
    sampleName: 'Luminous Drift',
    durationSec,
    features: validateAudioFeatures(input.features),
  }
}

const normalizeHex = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : fallback
}

const normalizeStringArray = (value: unknown, label: string, min: number, max: number) => {
  if (!Array.isArray(value)) {
    throw new InvalidPoemResponseError(`${label} must be an array.`)
  }

  const lines = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max)

  if (lines.length < min) {
    throw new InvalidPoemResponseError(`${label} must contain at least ${min} non-empty strings.`)
  }

  return lines
}

export function parsePoemModelOutput(output: string): PoemResponse {
  let parsed: unknown

  try {
    parsed = JSON.parse(output)
  } catch {
    throw new InvalidPoemResponseError('Model output was not valid JSON.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new InvalidPoemResponseError('Model output must be a JSON object.')
  }

  const input = parsed as Record<string, unknown>
  const palette = input.palette && typeof input.palette === 'object' ? (input.palette as Record<string, unknown>) : {}

  return {
    lines: normalizeStringArray(input.lines, 'lines', 5, 8),
    moodWords: normalizeStringArray(input.moodWords, 'moodWords', 2, 6),
    palette: {
      primary: normalizeHex(palette.primary, '#8ee8ff'),
      accent: normalizeHex(palette.accent, '#f4c979'),
    },
  }
}
