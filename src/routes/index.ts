import { Router } from 'express';
import rewriteRouter from './rewrite';
import healthRouter from './health';
import asyncQueueRouter from './asyncQueue';
import streamingRouter from './streaming';
import observabilityRouter from './observability';

const router = Router();

// Register all routes
router.use('/', rewriteRouter);
router.use('/', healthRouter);
router.use('/', asyncQueueRouter);
router.use('/', streamingRouter);
router.use('/', observabilityRouter);

export default router;
