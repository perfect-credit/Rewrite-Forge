import Anthropic from '@anthropic-ai/sdk';
import { ObservableCache } from './observabilityService';

// Use the observable cache instead of LRU cache
const cache = new ObservableCache('anthropic');

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("Missing ANTHROPIC_API_KEY in environment variables. Anthropic service will not be available.");
}

const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

if (apiKey) {
  console.log("Anthropic key loaded:", apiKey.slice(0, 8) + "...");
}

export async function getAnthropicResponse(text: string, style: string): Promise<string> {
  if (!anthropic) {
    throw new Error("Anthropic service is not configured. Please set ANTHROPIC_API_KEY in your environment variables.");
  }

  const cacheKey = `${text}:${style}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

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

    const response = await anthropic!.messages.create({
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
    
    // Enhanced error handling for different types of failures
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Network error: Unable to connect to Anthropic API. Please check your internet connection.");
    }
    
    if (error.status === 401) {
      throw new Error("Authentication error: Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY.");
    }
    
    if (error.status === 429) {
      throw new Error("Rate limit error: Too many requests to Anthropic API. Please try again later.");
    }
    
    if (error.status === 500) {
      throw new Error("Anthropic service error: Internal server error. Please try again later.");
    }
    
    // Generic error with more context
    throw new Error(`Anthropic API error: ${error.message || 'Unknown error occurred'}`);
  }
}