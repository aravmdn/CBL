/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { InvalidPoemRequestError, InvalidPoemResponseError } from './errors'
import { parsePoemModelOutput, validatePoemRequest } from './validation'

const validRequest = {
  sampleName: 'Luminous Drift',
  durationSec: 48,
  features: {
    averageEnergy: 0.4,
    peakEnergy: 0.8,
    bass: 0.3,
    mids: 0.5,
    treble: 0.2,
    pulseBpm: 84,
    dominantChakra: null,
  },
}

describe('poem validation', () => {
  it('accepts the planned request shape', () => {
    expect(validatePoemRequest(validRequest)).toEqual(validRequest)
  })

  it('rejects malformed request payloads', () => {
    expect(() => validatePoemRequest({ ...validRequest, sampleName: 'Other' })).toThrow(InvalidPoemRequestError)
  })

  it('parses a valid model response', () => {
    const parsed = parsePoemModelOutput(
      JSON.stringify({
        lines: ['one', 'two', 'three', 'four', 'five'],
        moodWords: ['soft', 'near'],
        palette: { primary: '#8ee8ff', accent: '#f4c979' },
      }),
    )

    expect(parsed.lines).toHaveLength(5)
    expect(parsed.palette.primary).toBe('#8ee8ff')
  })

  it('rejects malformed model output', () => {
    expect(() => parsePoemModelOutput('not json')).toThrow(InvalidPoemResponseError)
    expect(() => parsePoemModelOutput(JSON.stringify({ lines: ['too short'], moodWords: [] }))).toThrow(InvalidPoemResponseError)
  })
})
