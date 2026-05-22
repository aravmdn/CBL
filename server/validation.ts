import type { ChakraInfo, HeartbeatFeatures, HeartbeatTrend, PoemRequest, PoemResponse } from '../src/types'
import { InvalidPoemRequestError, InvalidPoemResponseError } from './errors'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const readNumber = (value: unknown, label: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidPoemRequestError(`${label} must be a finite number.`)
  }

  return value
}

const HEARTBEAT_TRENDS = new Set<HeartbeatTrend>(['calming', 'stable', 'rising'])

const normalizeHex = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : fallback
}

function validateChakra(value: unknown): ChakraInfo | null {
  if (value === null || value === undefined) {
    return null
  }

  if (!value || typeof value !== 'object') {
    throw new InvalidPoemRequestError('heartbeat.dominantChakra must be an object or null.')
  }

  const input = value as Record<string, unknown>
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    throw new InvalidPoemRequestError('heartbeat.dominantChakra.name must be a non-empty string.')
  }

  const frequency = readNumber(input.frequency, 'heartbeat.dominantChakra.frequency')
  if (frequency <= 0) {
    throw new InvalidPoemRequestError('heartbeat.dominantChakra.frequency must be greater than zero.')
  }

  return {
    name: input.name.trim(),
    frequency,
    color: normalizeHex(input.color, '#8ee8ff'),
  }
}

function validateHeartbeat(value: unknown): HeartbeatFeatures {
  if (!value || typeof value !== 'object') {
    throw new InvalidPoemRequestError('heartbeat must be an object.')
  }

  const input = value as Record<string, unknown>
  const bpm = readNumber(input.bpm, 'heartbeat.bpm')
  if (bpm < 30 || bpm > 220) {
    throw new InvalidPoemRequestError('heartbeat.bpm must be between 30 and 220.')
  }

  if (typeof input.trend !== 'string' || !HEARTBEAT_TRENDS.has(input.trend as HeartbeatTrend)) {
    throw new InvalidPoemRequestError('heartbeat.trend must be calming, stable, or rising.')
  }

  return {
    bpm: Math.round(bpm),
    trend: input.trend as HeartbeatTrend,
    variability: clamp01(readNumber(input.variability, 'heartbeat.variability')),
    dominantChakra: validateChakra(input.dominantChakra),
  }
}

export function validatePoemRequest(value: unknown): PoemRequest {
  if (!value || typeof value !== 'object') {
    throw new InvalidPoemRequestError('Request body must be an object.')
  }

  const input = value as Record<string, unknown>
  if (input.session !== 'bowl-meditation') {
    throw new InvalidPoemRequestError('session must be "bowl-meditation".')
  }

  return {
    session: 'bowl-meditation',
    heartbeat: validateHeartbeat(input.heartbeat),
  }
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
