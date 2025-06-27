import { Request, Response, NextFunction } from 'express';
import { metricsStore } from '../services/observabilityService';
import { RequestLog } from '../types/type';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
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
