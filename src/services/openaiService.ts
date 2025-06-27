import OpenAI from 'openai';
import { ObservableCache } from './cacheService';
import { Response } from 'express';

const cache = new ObservableCache('openai');
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("Missing OPENAI_API_KEY in environment variables. OpenAI service will not be available.");
}

const openai = apiKey ? new OpenAI({ apiKey }) : null;

if (openai) {
  console.log("OpenAI key loaded:", apiKey!.slice(0, 8) + "...");
}

const MODEL = "gpt-4";
const MAX_TOKENS = 1024;

export async function getOpenAIResponse(text: string, style: string): Promise<string> {
  if (!openai) throw new Error("OpenAI service is not configured");

  const cacheKey = `${text}:${style}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const response = await fetchOpenAIResponse(text, style);
  cache.set(cacheKey, response);
  return response;
}

export async function streamOpenAIResponse(text: string, style: string, res: Response): Promise<void> {
  if (!openai) throw new Error("OpenAI is not configured. Set OPENAI_API_KEY.");

  const cacheKey = `${text}:${style}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log(`[OpenAI] Streaming from cache: ${cacheKey}`);
    return streamCachedResponse(cached, text, style, 'openai', res);
  }

  console.log(`[OpenAI] Fetching stream from OpenAI: ${cacheKey}`);

  try {
    const prompt = createPrompt(text, style);
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: MAX_TOKENS,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (!content) continue;

      fullResponse += content;
      const event = formatEvent('content', { chunk: content, isPartial: true });
      res.write(`data: ${event}\n\n`);
    }

    cache.set(cacheKey, fullResponse);
    console.log(`[OpenAI] Cached: ${cacheKey}`);

    res.write(`data: ${formatEvent('complete', {
      original: text,
      rewritten: fullResponse,
      style,
      llm: 'openai'
    })}\n\n`);
    res.end();

  } catch (error: any) {
    handleStreamingError(error, text, res);
  }
}

export async function fetchOpenAIResponse(text: string, style: string): Promise<string> {
  try {
    const prompt = createPrompt(text, style);
    const response = await openai!.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: MAX_TOKENS,
    });

    const content = response.choices[0]?.message?.content?.trim();
    return content || "No response from OpenAI.";
  } catch (error: any) {
    throw handleOpenAIError(error);
  }
}

// Helpers

function createPrompt(text: string, style: string): string {
  return `[*${style}*] ${text}`;
}

function formatEvent(type: string, data: any): string {
  return JSON.stringify({ type, data, timestamp: Date.now() });
}

async function streamCachedResponse(
  cached: string, original: string, style: string, llm: string, res: Response
): Promise<void> {
  try {
    for (const char of cached) {
      const event = formatEvent('content', { chunk: char, isPartial: true, isCached: true });
      res.write(`data: ${event}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 10)); // optional realism
    }

    res.write(`data: ${formatEvent('complete', {
      original, rewritten: cached, style, llm, isCached: true
    })}\n\n`);
    res.end();

  } catch (error: any) {
    throw handleOpenAIError(error);
  }
}

function handleStreamingError(error: any, text: string, res: Response) {
  console.error("OpenAI streaming error:", error);
  res.write(`data: ${formatEvent('error', {
    message: error instanceof Error ? error.message : 'OpenAI streaming failed',
    original: text
  })}\n\n`);
  res.end();
}

function handleOpenAIError(error: any): Error {
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new Error("Network error: Unable to connect to OpenAI API");
  }
  if (error.status === 401) {
    return new Error("Authentication error: Invalid OpenAI API key");
  }
  if (error.status === 429) {
    return new Error("Rate limit error: Too many requests to OpenAI API");
  }
  if (error.status === 500) {
    return new Error("OpenAI service error: Internal server error. Please try again later.");
  }
  return new Error(`OpenAI API error: ${error.message || 'Unknown error occurred'}`);
}

// Export alias for backward compatibility with tests
export const openAIResponse = fetchOpenAIResponse;