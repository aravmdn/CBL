import OpenAI from 'openai'
import type { PoemRequest, PoemResponse } from '../src/types'
import { MissingProviderKeyError } from './errors'
import { parsePoemModelOutput } from './validation'

export type PoemGenerator = (request: PoemRequest) => Promise<PoemResponse>

const chakraLine = (request: PoemRequest) => {
  const chakra = request.heartbeat.dominantChakra
  if (!chakra) {
    return '- dominant bowl chakra: unknown'
  }

  return `- dominant bowl chakra: ${chakra.name} (${chakra.frequency.toFixed(0)} Hz, ${chakra.color})`
}

const buildPrompt = (request: PoemRequest) => `Create a short poem for a live singing bowl and camera installation.

Return only JSON with this shape:
{
  "lines": ["5 to 8 short poetic lines, each under 52 characters"],
  "moodWords": ["2 to 6 lowercase mood words"],
  "palette": { "primary": "#RRGGBB", "accent": "#RRGGBB" }
}

Session: ${request.session}
Heartbeat and bowl state:
- bpm: ${request.heartbeat.bpm}
- trend: ${request.heartbeat.trend}
- variability: ${request.heartbeat.variability.toFixed(3)}
${chakraLine(request)}

Style: intimate, luminous, restrained, human. Use the bowl and body state as quiet inspiration. Avoid cliche tech language.`

export async function generatePoemWithOpenAI(request: PoemRequest): Promise<PoemResponse> {
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    const client = new OpenAI({
      apiKey: openRouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://127.0.0.1:5173',
        'X-Title': 'CBL Camera Poetry Prototype',
      },
    })
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You write concise contemporary poetry for an interactive camera artwork. You always return valid JSON and no prose outside JSON.',
        },
        {
          role: 'user',
          content: buildPrompt(request),
        },
      ],
      max_tokens: 180,
      temperature: 0.9,
    })
    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('OpenRouter returned an empty poetry response.')
    }

    return parsePoemModelOutput(content)
  }

  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) {
    throw new MissingProviderKeyError()
  }

  const client = new OpenAI({ apiKey: openAIKey })
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
  const response = await client.responses.create({
    model,
    max_output_tokens: 180,
    input: [
      {
        role: 'system',
        content:
          'You write concise contemporary poetry for an interactive camera artwork. You always return valid JSON and no prose outside JSON.',
      },
      {
        role: 'user',
        content: buildPrompt(request),
      },
    ],
  })

  return parsePoemModelOutput(response.output_text)
}
