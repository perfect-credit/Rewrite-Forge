import { config } from '../config';

import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, string>({
  max: 100,            // maximum number of items to store
  ttl: 1000 * 300,     // TTL in milliseconds (5 minutes)
});

// Simple in-memory cache

export async function getLocalmocResponse(text: string, style: string): Promise<string> {
  const cacheKey = `${text}:${style}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit for:', cacheKey);
    return cached;
  }

  console.log('Cache miss for:', cacheKey);
  const rewritten = await callLLM(text, style);
  cache.set(cacheKey, rewritten);

  return rewritten;
}

export async function callLLM(text: string, style: string): Promise<string> {
  // Simulated lightweight LLM with better mocking
  if (!config.llmApiKey) {
    return localmocResponse(text, style);
  }

  // Here you would implement actual API calls to OpenAI or Anthropic
  // For now, we'll use the mock as well
  return localmocResponse(text, style);
}

function localmocResponse(text: string, style: string): string {
  return `[*${style}*] ${text}`;
}