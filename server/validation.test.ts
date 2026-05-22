/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { InvalidPoemRequestError, InvalidPoemResponseError } from './errors'
import { parsePoemModelOutput, validatePoemRequest } from './validation'

const validRequest = {
  session: 'bowl-meditation',
  heartbeat: {
    bpm: 68,
    trend: 'calming',
    variability: 0.42,
    dominantChakra: null,
  },
}

describe('poem validation', () => {
  it('accepts the planned request shape', () => {
    expect(validatePoemRequest(validRequest)).toEqual(validRequest)
  })

  it('accepts a live dominant chakra from bowl analysis', () => {
    const parsed = validatePoemRequest({
      ...validRequest,
      heartbeat: {
        ...validRequest.heartbeat,
        dominantChakra: { name: 'Heart', frequency: 639, color: '#00ff00' },
      },
    })

    expect(parsed.heartbeat.dominantChakra).toEqual({ name: 'Heart', frequency: 639, color: '#00ff00' })
  })

  it('rejects malformed request payloads', () => {
    expect(() => validatePoemRequest({ ...validRequest, session: 'Other' })).toThrow(InvalidPoemRequestError)
    expect(() => validatePoemRequest({ ...validRequest, heartbeat: { ...validRequest.heartbeat, trend: 'falling' } })).toThrow(
      InvalidPoemRequestError,
    )
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
