export class MissingProviderKeyError extends Error {
  constructor() {
    super('OPENROUTER_API_KEY or OPENAI_API_KEY is not set. Add one to your environment before generating live poetry.')
    this.name = 'MissingProviderKeyError'
  }
}

export class InvalidPoemRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPoemRequestError'
  }
}

export class InvalidPoemResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPoemResponseError'
  }
}
