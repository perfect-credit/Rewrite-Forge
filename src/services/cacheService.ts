import { CacheMetrics } from '../types/type';

// Cache wrapper for services with built-in metrics tracking
export class ObservableCache {
  private cache: Map<string, string> = new Map();
  private serviceName: string;
  private metrics: CacheMetrics;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0
    };
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key);
    if (value) {
      this.recordCacheHit();
      console.log(`[${this.serviceName}] Cache HIT for: ${key}`);
    } else {
      this.recordCacheMiss();
      console.log(`[${this.serviceName}] Cache MISS for: ${key}`);
    }
    return value;
  }

  set(key: string, value: string): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
    this.resetMetrics();
  }

  size(): number {
    return this.cache.size;
  }

  // Additional utility methods
  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): string[] {
    return Array.from(this.cache.values());
  }

  entries(): [string, string][] {
    return Array.from(this.cache.entries());
  }

  // Metrics methods
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  private recordCacheHit(): void {
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.updateHitRate();
  }

  private recordCacheMiss(): void {
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.updateHitRate();
  }

  private updateHitRate(): void {
    this.metrics.hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0
    };
  }
}

