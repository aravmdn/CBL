import type { BowlMeditationRequest, HeartbeatFeatures, PoemResponse } from '../types'

// Dormant legacy path: poetry is not imported by the active visual app.
export async function requestPoem(heartbeat: HeartbeatFeatures): Promise<PoemResponse> {
  const requestBody: BowlMeditationRequest = {
    session: 'bowl-meditation',
    heartbeat,
  }

  const response = await fetch('/api/poem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const payload = (await response.json()) as PoemResponse | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Poetry generation failed.')
  }

  return payload as PoemResponse
}
