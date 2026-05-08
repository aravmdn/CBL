import cors from 'cors'
import express from 'express'
import { InvalidPoemRequestError, InvalidPoemResponseError, MissingProviderKeyError } from './errors'
import { generatePoemWithOpenAI, type PoemGenerator } from './openaiPoem'
import { validatePoemRequest } from './validation'

type CreateAppOptions = {
  generatePoem?: PoemGenerator
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express()
  const generatePoem = options.generatePoem ?? generatePoemWithOpenAI

  app.use(cors())
  app.use(express.json({ limit: '64kb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.post('/api/poem', async (request, response) => {
    try {
      const poemRequest = validatePoemRequest(request.body)
      const poem = await generatePoem(poemRequest)
      response.json(poem)
    } catch (error) {
      if (error instanceof InvalidPoemRequestError) {
        response.status(400).json({ error: error.message })
        return
      }

      if (error instanceof MissingProviderKeyError) {
        response.status(503).json({ error: error.message })
        return
      }

      if (error instanceof InvalidPoemResponseError) {
        response.status(502).json({ error: error.message })
        return
      }

      console.error(error)
      response.status(500).json({ error: 'Unable to generate poetry right now.' })
    }
  })

  return app
}
