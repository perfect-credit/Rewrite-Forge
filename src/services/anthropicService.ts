import Anthropic from '@anthropic-ai/sdk';
import { ObservableCache } from './cacheService';
import { Response } from 'express';

const cache = new ObservableCache('anthropic');

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("Missing ANTHROPIC_API_KEY in environment variables. Anthropic service will not be available.");
}

const anthropic = apiKey ? new Anthropic({ apiKey }) : null;
if (anthropic) {
  console.log("Anthropic key loaded:", apiKey!.slice(0, 8) + "...");
}

const MODEL = "claude-3-opus-20240229";

export async function getAnthropicResponse(text: string, style: string): Promise<string> {
  if (!anthropic) {
    throw new Error("Anthropic service is not configured");
  }

  const cacheKey = `${text}:${style}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rewritten = await anthropicResponse(text, style);
  cache.set(cacheKey, rewritten);
  return rewritten;
}

export async function streamAnthropicResponse(
  text: string,
  style: string,
  res: Response
): Promise<void> {
  if (!anthropic) {
    throw new Error("Anthropic service not configured. Set ANTHROPIC_API_KEY.");
  }

  const cacheKey = `${text}:${style}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log(`[Anthropic] Cache HIT for streaming: ${cacheKey}`);
    return streamCachedResponse(cached, text, style, 'anthropic', res);
  }

  console.log(`[Anthropic] Cache MISS for streaming: ${cacheKey}`);
  const prompt = `[*${style}*] ${text}`;

  try {
    const stream = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const content = chunk.delta.text;
        fullResponse += content;

        res.write(`data: ${JSON.stringify({
          type: 'content',
          data: { chunk: content, isPartial: true },
          timestamp: Date.now()
        })}\n\n`);
      }
    }

    cache.set(cacheKey, fullResponse);
    console.log(`[Anthropic] Cached streaming response: ${cacheKey}`);

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: {
        original: text,
        rewritten: fullResponse,
        style,
        llm: 'anthropic'
      },
      timestamp: Date.now()
    })}\n\n`);
    res.end();

  } catch (error: any) {
    handleAnthropicError(error, res, text);
  }
}

export async function anthropicResponse(text: string, style: string): Promise<string> {
  if (!anthropic) {
    throw new Error("Anthropic service not configured. Set ANTHROPIC_API_KEY.");
  }

  try {
    const prompt = `[*${style}*] ${text}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find(
      block => block.type === "text"
    ) as { type: "text"; text: string } | undefined;

    return textBlock?.text.trim() ?? "No text response from Claude.";
  } catch (error: any) {
    handleAnthropicError(error);
  }
}

// Helper: Stream cached data char by char
async function streamCachedResponse(
  cachedResponse: string,
  originalText: string,
  style: string,
  llm: string,
  res: Response
): Promise<void> {
  try {
    for (let i = 0; i < cachedResponse.length; i++) {
      const char = cachedResponse[i];
      res.write(`data: ${JSON.stringify({
        type: 'content',
        data: { chunk: char, isPartial: true, isCached: true },
        timestamp: Date.now()
      })}\n\n`);

      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate streaming
    }

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: {
        original: originalText,
        rewritten: cachedResponse,
        style,
        llm,
        isCached: true
      },
      timestamp: Date.now()
    })}\n\n`);
    res.end();
  } catch (error: any) {
    handleAnthropicError(error, res, originalText);
  }
}

// Shared error handler
function handleAnthropicError(error: any, res?: Response, originalText?: string): never {
  console.error("Anthropic error:", error);

  const message =
    error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED'
      ? "Network error: Unable to connect to Anthropic API."
      : error?.status === 401
        ? "Authentication error: Invalid Anthropic API key."
        : error?.status === 429
          ? "Rate limit error: Too many requests."
          : error?.status === 500
            ? "Anthropic service error: Internal server error."
            : `Anthropic API error: ${error?.message || 'Unknown error occurred'}`;

  if (res && originalText) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      data: { message, original: originalText },
      timestamp: Date.now()
    })}\n\n`);
    res.end();
  }

  throw new Error(message);
}
