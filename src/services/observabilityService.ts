import { Request, Response } from 'express';

// Cache metrics interface
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

// Request log interface
export interface RequestLog {
  timestamp: Date;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  requestBody?: any;
  error?: string;
}

// Global metrics storage
class MetricsStore {
  private cacheMetrics: Map<string, CacheMetrics> = new Map();
  private requestLogs: RequestLog[] = [];
  private maxLogs: number = 1000; // Keep last 1000 requests

  // Cache metrics methods
  recordCacheHit(service: string): void {
    const metrics = this.getOrCreateCacheMetrics(service);
    metrics.hits++;
    metrics.totalRequests++;
    this.updateHitRate(metrics);
    this.cacheMetrics.set(service, metrics);
  }

  recordCacheMiss(service: string): void {
    const metrics = this.getOrCreateCacheMetrics(service);
    metrics.misses++;
    metrics.totalRequests++;
    this.updateHitRate(metrics);
    this.cacheMetrics.set(service, metrics);
  }

  getCacheMetrics(service?: string): CacheMetrics | Map<string, CacheMetrics> {
    if (service) {
      return this.cacheMetrics.get(service) || this.createEmptyMetrics();
    }
    return this.cacheMetrics;
  }

  private getOrCreateCacheMetrics(service: string): CacheMetrics {
    return this.cacheMetrics.get(service) || this.createEmptyMetrics();
  }

  private createEmptyMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0
    };
  }

  private updateHitRate(metrics: CacheMetrics): void {
    metrics.hitRate = metrics.totalRequests > 0 ? (metrics.hits / metrics.totalRequests) * 100 : 0;
  }

  // Request logging methods
  logRequest(log: RequestLog): void {
    this.requestLogs.push(log);
    
    // Keep only the last maxLogs entries
    if (this.requestLogs.length > this.maxLogs) {
      this.requestLogs = this.requestLogs.slice(-this.maxLogs);
    }
  }

  getRequestLogs(limit: number = 100): RequestLog[] {
    return this.requestLogs.slice(-limit).reverse();
  }

  getRequestStats(): {
    totalRequests: number;
    averageResponseTime: number;
    statusCodeDistribution: Record<number, number>;
    recentErrors: number;
  } {
    const logs = this.requestLogs;
    const totalRequests = logs.length;
    
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        statusCodeDistribution: {},
        recentErrors: 0
      };
    }

    const totalResponseTime = logs.reduce((sum, log) => sum + log.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalRequests;

    const statusCodeDistribution: Record<number, number> = {};
    logs.forEach(log => {
      statusCodeDistribution[log.statusCode] = (statusCodeDistribution[log.statusCode] || 0) + 1;
    });

    const recentErrors = logs.filter(log => log.statusCode >= 400).length;

    return {
      totalRequests,
      averageResponseTime,
      statusCodeDistribution,
      recentErrors
    };
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.cacheMetrics.clear();
    this.requestLogs = [];
  }
}

// Singleton instance
export const metricsStore = new MetricsStore();

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: Function): void {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function(data: any): Response {
    const responseTime = Date.now() - startTime;
    
    const log: RequestLog = {
      timestamp: new Date(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestBody: req.method !== 'GET' ? req.body : undefined
    };

    // Add error information if status code indicates error
    if (res.statusCode >= 400) {
      log.error = typeof data === 'string' ? data : JSON.stringify(data);
    }

    metricsStore.logRequest(log);
    
    return originalSend.call(this, data);
  };

  next();
}

// Cache wrapper for services
export class ObservableCache {
  private cache: Map<string, string> = new Map();
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key);
    if (value) {
      metricsStore.recordCacheHit(this.serviceName);
      console.log(`[${this.serviceName}] Cache HIT for: ${key}`);
    } else {
      metricsStore.recordCacheMiss(this.serviceName);
      console.log(`[${this.serviceName}] Cache MISS for: ${key}`);
    }
    return value;
  }

  set(key: string, value: string): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
} 