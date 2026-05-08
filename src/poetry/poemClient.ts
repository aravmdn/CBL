import type { AudioFeatures, PoemResponse } from '../types'

export async function requestPoem(features: AudioFeatures, durationSec: number): Promise<PoemResponse> {
  const response = await fetch('/api/poem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sampleName: 'Luminous Drift',
      durationSec,
      features,
    }),
  })

  const payload = (await response.json()) as PoemResponse | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Poetry generation failed.')
  }

  return payload as PoemResponse
}
