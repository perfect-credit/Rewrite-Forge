import express, { Express, Request, Response, NextFunction } from 'express';
import rewriteRouter from './routes/rewrite';
import healthRouter from './routes/health';
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
  res.json({ message: 'RewriteForge Service - Turning plain text into a new style' });
});

// Routes
app.use('/', rewriteRouter);
app.use('/', healthRouter);
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

// Start the server (just once!)
app.listen(port, () => {
  console.log(`RewriteForge service is running on http://localhost:${port}`);
});

export default app;