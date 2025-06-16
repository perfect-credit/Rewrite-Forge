import OpenAI from 'openai';
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, string>({
  max: 100,            // maximum number of items to store
  ttl: 1000 * 300,     // TTL in milliseconds (5 minutes)
});

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("Missing OPENAI_API_KEY in environment variables. OpenAI service will not be available.");
}

const openai = apiKey ? new OpenAI({ apiKey }) : null;

if (apiKey) {
  console.log("OpenAI key loaded:", apiKey.slice(0, 8) + "...");
}

export async function getOpenAIResponse(text: string, style: string): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI service is not configured. Please set OPENAI_API_KEY in your environment variables.");
  }

  const cacheKey = `${text}:${style}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit for:', cacheKey);
    return cached;
  }

  console.log('Cache miss for:', cacheKey);
  const rewritten = await openAIResponse(text, style);
  cache.set(cacheKey, rewritten);
  return rewritten;
}

export async function openAIResponse(text:string, style: string): Promise<string> {
  try {
    const prompt:string = `[*${style}*] ${text}`

    // Ensure prompt is a plain string
    if (typeof prompt !== 'string') {
      throw new Error("Invalid prompt: must be a string.");
    }
    
    const chatCompletion = await openai!.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo"
      messages: [
        {
          role: "user",
          content: prompt, // must be string only
        },
      ],
      max_tokens: 1024,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    return content?.trim() ?? "No response from OpenAI.";
  } catch (error: any) {
    console.error("OpenAI error:", error);
    
    // Enhanced error handling for different types of failures
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Network error: Unable to connect to OpenAI API. Please check your internet connection.");
    }
    
    if (error.status === 401) {
      throw new Error("Authentication error: Invalid OpenAI API key. Please check your OPENAI_API_KEY.");
    }
    
    if (error.status === 429) {
      throw new Error("Rate limit error: Too many requests to OpenAI API. Please try again later.");
    }
    
    if (error.status === 500) {
      throw new Error("OpenAI service error: Internal server error. Please try again later.");
    }
    
    // Generic error with more context
    throw new Error(`OpenAI API error: ${error.message || 'Unknown error occurred'}`);
  }
}