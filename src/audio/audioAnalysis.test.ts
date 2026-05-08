/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { analyzeSamples } from './audioAnalysis'

function makeFixture(sampleRate = 8000, seconds = 5) {
  const samples = new Float32Array(sampleRate * seconds)

  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate
    const beatPhase = (time * 2) % 1
    const pulse = beatPhase < 0.12 ? 1 : 0.25
    samples[index] =
      Math.sin(2 * Math.PI * 110 * time) * 0.35 * pulse +
      Math.sin(2 * Math.PI * 880 * time) * 0.2 +
      Math.sin(2 * Math.PI * 3200 * time) * 0.08
  }

  return samples
}

describe('analyzeSamples', () => {
  it('extracts bounded energy and band features from a deterministic fixture', () => {
    const sampleRate = 8000
    const fixture = makeFixture(sampleRate)
    const features = analyzeSamples([fixture], sampleRate, fixture.length / sampleRate)

    expect(features.averageEnergy).toBeGreaterThan(0)
    expect(features.averageEnergy).toBeLessThanOrEqual(1)
    expect(features.peakEnergy).toBeGreaterThan(features.averageEnergy)
    expect(features.bass + features.mids + features.treble).toBeCloseTo(1, 2)
    expect(features.bass).toBeGreaterThan(0)
    expect(features.mids).toBeGreaterThan(0)
    expect(features.treble).toBeGreaterThan(0)
  })
})
