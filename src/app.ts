import express, { Express, Request, Response, NextFunction } from 'express';
import rewriteRouter from './routes/rewrite';
import healthRouter from './routes/health';
import asyncQueueRouter from './routes/asyncQueue';
// import openaiRoutes from "./routes/openaiRoutes";
// import anthropicRoutes from './routes/anthropicRoutes';
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '5kb' })); // Accept body size < 5000 chars

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'RewriteForge Service - Turning plain text into a new style',
    endpoints: {
      synchronous: '/v1/rewrite',
      asynchronous: '/v1/rewrite/submit',
      health: '/health',
      queueStats: '/v1/rewrite/queue/stats'
    }
  });
});

// Routes
app.use('/', rewriteRouter);
app.use('/', healthRouter);
app.use('/', asyncQueueRouter);
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
    console.log('  GET /health - Health check');
  });
}

export default app;