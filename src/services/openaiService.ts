import OpenAI from 'openai';
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, string>({
  max: 100,            // maximum number of items to store
  ttl: 1000 * 300,     // TTL in milliseconds (5 minutes)
});

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY in environment variables.");
}

const openai = new OpenAI({ apiKey });

console.log("OpenAI key loaded:", apiKey.slice(0, 8) + "...");

export async function getOpenAIResponse(text: string, style: string): Promise<string> {
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
    
    const chatCompletion = await openai.chat.completions.create({
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
    console.error("OpenAI error:", error?.message || error);
    throw new Error("Failed to get OpenAI response.");
  }
}