import Anthropic from '@anthropic-ai/sdk';
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, string>({
  max: 100,            // maximum number of items to store
  ttl: 1000 * 300,     // TTL in milliseconds (5 minutes)
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function getAnthropicResponse(text: string, style: string): Promise<string> {
  const cacheKey = `${text}:${style}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit for:', cacheKey);
    return cached;
  }

  console.log('Cache miss for:', cacheKey);
  const rewritten = await anthropicResponse(text, style);
  cache.set(cacheKey, rewritten);
  return rewritten;
}

export async function anthropicResponse(text: string, style: string): Promise<string> {
  try {
    const prompt:string = `[*${style}*] ${text}`

    // Ensure prompt is a plain string
    if (typeof prompt !== 'string') {
      throw new Error("Invalid prompt: must be a string.");
    }

    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Safely extract text block
    const textBlock = response.content.find(
      (block) => block.type === "text"
    ) as { type: "text"; text: string } | undefined;

    return textBlock?.text.trim() ?? "No text response from Claude.";
  } catch (error: any) {
    console.error("Anthropic error:", error);
    throw new Error("Failed to get Claude response.");
  }
}