import { Request, Response } from 'express';
import { metricsStore } from '../services/observabilityService';

/**
 * GET /metrics/cache
 * Get cache hit/miss metrics for all services or a specific service
 */
export const getCacheMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { service } = req.query;

    console.log('service->', req.query);
    
    if (service && typeof service === 'string') {
      const metrics = metricsStore.getCacheMetrics(service);
      res.json({
        service,
        metrics,
        timestamp: new Date().toISOString()
      });
    } else {
      const allMetrics = metricsStore.getCacheMetrics();
      res.json({
        allServices: allMetrics,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Cache metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to get cache metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /metrics/requests
 * Get request statistics and logs
 */
export const getRequestMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit } = req.query;
    const logLimit = limit ? parseInt(limit as string) : 100;
    
    const stats = metricsStore.getRequestStats();
    const recentLogs = metricsStore.getRequestLogs(logLimit);
    
    res.json({
      statistics: stats,
      recentLogs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Request metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to get request metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /metrics/overview
 * Get comprehensive overview of all metrics
 */
export const getMetricsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const cacheMetrics = metricsStore.getCacheMetrics() as Map<string, any>;
    const requestStats = metricsStore.getRequestStats();
    const recentLogs = metricsStore.getRequestLogs(10); // Last 10 requests
    
    const metricsArray = Array.from(cacheMetrics.values());
    
    res.json({
      cache: {
        services: cacheMetrics,
        summary: {
          totalHits: metricsArray.reduce((sum, metrics) => sum + metrics.hits, 0),
          totalMisses: metricsArray.reduce((sum, metrics) => sum + metrics.misses, 0),
          overallHitRate: metricsArray.reduce((sum, metrics) => sum + metrics.hitRate, 0) / Math.max(cacheMetrics.size, 1)
        }
      },
      requests: requestStats,
      recentActivity: recentLogs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Metrics overview error:', error);
    res.status(500).json({ 
      error: 'Failed to get metrics overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /metrics/reset
 * Reset all metrics (useful for testing)
 */
export const resetMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    metricsStore.resetMetrics();
    res.json({
      message: 'All metrics have been reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to reset metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 