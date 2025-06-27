import { config } from '../config';
import { ObservableCache } from './cacheService';

// Use the observable cache instead of LRU cache
const cache = new ObservableCache('localmoc');

// Simple in-memory cache

export async function getLocalmocResponse(text: string, style: string): Promise<string> {
  const cacheKey = `${text}:${style}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit for:', cacheKey);
    return cached;
  }
  console.log(config.llmApiKey);
  console.log('Cache miss for:', cacheKey);
  const rewritten = `[*${style}*] ${text}`;
  cache.set(cacheKey, rewritten);

  return rewritten;
}