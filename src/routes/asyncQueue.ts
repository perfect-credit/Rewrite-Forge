import { Router } from 'express';
import { submitRewriteJob, getJobResult, getQueueStatistics } from '../controllers/asyncQueueController';

const router = Router();

// POST /v1/rewrite/submit - Submit a new job
router.post('/rewrite/submit', submitRewriteJob);

// GET /v1/rewrite/result/:jobId - Get job result
router.get('/rewrite/result/:jobId', getJobResult);

// GET /v1/rewrite/queue/stats - Get queue statistics
router.get('/rewrite/queue/stats', getQueueStatistics);

export default router; 