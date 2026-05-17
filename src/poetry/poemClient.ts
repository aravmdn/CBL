import type { HeartbeatFeatures, PoemResponse } from '../types'

export async function requestPoem(heartbeat: HeartbeatFeatures): Promise<PoemResponse> {
  const response = await fetch('/api/poem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: 'bowl-meditation',
      heartbeat,
    }),
  })

  const payload = (await response.json()) as PoemResponse | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Poetry generation failed.')
  }

  return payload as PoemResponse
}
