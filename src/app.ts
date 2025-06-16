import express, { Express, Request, Response, NextFunction } from 'express';
import rewriteRouter from './routes/rewrite';
import healthRouter from './routes/health';
import asyncQueueRouter from './routes/asyncQueue';
import streamingRouter from './routes/streaming';
import observabilityRouter from './routes/observability';
import { requestLogger } from './services/observabilityService';
// import openaiRoutes from "./routes/openaiRoutes";
// import anthropicRoutes from './routes/anthropicRoutes';
import dotenv from "dotenv";
import path from 'path';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '5kb' })); // Accept body size < 5000 chars

// Request logging middleware (add before routes)
app.use(requestLogger);

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'RewriteForge Service - Turning plain text into a new style',
    endpoints: {
      synchronous: '/v1/rewrite',
      asynchronous: '/v1/rewrite/submit',
      streaming: '/v1/rewrite/stream', //	Multiple (OpenAI, Anthropic, Local)
      streamingMock: '/v1/rewrite/stream/mock', //Local Mock Only
      health: '/health',
      queueStats: '/v1/rewrite/queue/stats',
      metrics: {
        cache: '/metrics/cache',
        requests: '/metrics/requests',
        overview: '/metrics/overview',
        reset: '/metrics/reset'
      },
      ui: {
        streamingTest: '/public/streaming-test.html'
      }
    }
  });
});

// Routes
app.use('/', rewriteRouter);
app.use('/', healthRouter);
app.use('/', asyncQueueRouter);
app.use('/', streamingRouter);
app.use('/', observabilityRouter);
// app.use("/", openaiRoutes);
// app.use("/", anthropicRoutes);
// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`RewriteForge service is running on http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log('  POST /v1/rewrite - Synchronous text rewriting');
    console.log('  POST /v1/rewrite/submit - Submit async job');
    console.log('  GET /v1/rewrite/result/:jobId - Get job result');
    console.log('  GET /v1/rewrite/queue/stats - Queue statistics');
    console.log('  POST /v1/rewrite/stream - Streaming text rewriting (SSE)');
    console.log('  POST /v1/rewrite/stream/mock - Mock streaming (SSE)');
    console.log('  GET /health - Health check');
    console.log('  GET /metrics/cache - Cache hit/miss metrics');
    console.log('  GET /metrics/requests - Request statistics');
    console.log('  GET /metrics/overview - Comprehensive metrics overview');
    console.log('  POST /metrics/reset - Reset all metrics');
    console.log('  GET /public/streaming-test.html - Streaming test UI');
  });
}

export default app;