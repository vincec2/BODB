import "dotenv/config";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const openaiModel = process.env.OPENAI_MODEL || "gpt-5.4-mini";

export function hasOpenAiKey() {
  return Boolean(apiKey);
}

export const openai = apiKey
  ? new OpenAI({
      apiKey
    })
  : null;