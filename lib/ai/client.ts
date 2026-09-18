import { createAnthropic } from "@ai-sdk/anthropic"
import type { LanguageModel } from "ai"

/** Thrown instead of ever fabricating AI results when no provider key is configured. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("The AI assistant is not configured. Set ANTHROPIC_API_KEY to enable this feature.")
    this.name = "AiNotConfiguredError"
  }
}

const DEFAULT_MODEL = "claude-haiku-4-5-20251001"

/** Reads the key from the environment only — never hard-coded, never sent to the client. */
export function getAiModel(): LanguageModel {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new AiNotConfiguredError()

  const anthropic = createAnthropic({ apiKey })
  return anthropic(process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL)
}
