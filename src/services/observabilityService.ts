import { CacheMetrics, RequestLog } from '../types/type';

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

// (requestLogger function removed) 