import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel } from "ai"

/** Thrown instead of ever fabricating AI results when no provider key is configured. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("The AI assistant is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY to enable this feature.")
    this.name = "AiNotConfiguredError"
  }
}

const DEFAULT_MODEL = "gemini-3.6-flash"

/** Reads the key from the environment only — never hard-coded, never sent to the client. */
export function getAiModel(): LanguageModel {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw new AiNotConfiguredError()

  const google = createGoogleGenerativeAI({ apiKey })
  return google(process.env.GEMINI_MODEL ?? DEFAULT_MODEL)
}
