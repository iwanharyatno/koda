import { createOpenAI } from '@ai-sdk/openai';

export const groq = createOpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.LLM_API_KEY,
});

export const DEFAULT_MODEL = 'gpt-5-nano';