import { Request, Response} from 'express';

// Global error handler middleware
export const globalErrorHandler = (err: Error, req: Request, res: Response): void => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

// 404 handler middleware
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
};
