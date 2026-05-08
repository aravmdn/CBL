/**
 * @vitest-environment node
 */
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { InvalidPoemResponseError, MissingProviderKeyError } from './errors'
import { createApp } from './app'

const poemRequest = {
  sampleName: 'Luminous Drift',
  durationSec: 48,
  features: {
    averageEnergy: 0.4,
    peakEnergy: 0.8,
    bass: 0.3,
    mids: 0.5,
    treble: 0.2,
    pulseBpm: null,
  },
}

describe('poem API', () => {
  it('returns generated poetry', async () => {
    const app = createApp({
      generatePoem: async () => ({
        lines: ['a', 'b', 'c', 'd', 'e'],
        moodWords: ['soft', 'near'],
        palette: { primary: '#8ee8ff', accent: '#f4c979' },
      }),
    })

    await request(app).post('/api/poem').send(poemRequest).expect(200).expect(({ body }) => {
      expect(body.lines).toHaveLength(5)
    })
  })

  it('returns a clear missing key error', async () => {
    const app = createApp({
      generatePoem: async () => {
        throw new MissingProviderKeyError()
      },
    })

    await request(app).post('/api/poem').send(poemRequest).expect(503).expect(({ body }) => {
      expect(body.error).toContain('OPENROUTER_API_KEY')
    })
  })

  it('returns a bad gateway for malformed model output', async () => {
    const app = createApp({
      generatePoem: async () => {
        throw new InvalidPoemResponseError('Model output was not valid JSON.')
      },
    })

    await request(app).post('/api/poem').send(poemRequest).expect(502).expect(({ body }) => {
      expect(body.error).toContain('Model output')
    })
  })

  it('rejects invalid request bodies', async () => {
    const app = createApp()
    await request(app).post('/api/poem').send({}).expect(400)
  })
})
