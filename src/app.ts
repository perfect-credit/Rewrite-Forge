import express, { Express} from 'express';
import appRouter from './routes/index';
import { requestLogger } from './middlewares/requestLogger';
import { globalErrorHandler, notFoundHandler } from './middlewares/errorHandler';
import path from 'path';

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '5kb' })); // Accept body size < 5000 chars

// Request logging middleware (add before routes)
app.use(requestLogger);

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/v1', appRouter);

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

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
    console.log('  GET /v1/health - Health check');
    console.log('  GET /v1/metrics/cache?service=openai(anthropic or openai) - Cache hit/miss metrics');
    console.log('  GET /v1/metrics/requests?limit=50 - Request statistics');
    console.log('  GET /v1/metrics/overview - Comprehensive metrics overview');
    console.log('  POST /v1/metrics/reset - Reset all metrics');
    console.log('  GET /public/streaming-test.html - Streaming test UI');
  });
}

export default app;