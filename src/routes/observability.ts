import { Router } from 'express';
import { 
  getCacheMetrics, 
  getRequestMetrics, 
  getMetricsOverview, 
  resetMetrics 
} from '../controllers/observabilityController';

const router = Router();

// Cache metrics endpoints
router.get('/metrics/cache', getCacheMetrics);

// Request metrics endpoints
router.get('/metrics/requests', getRequestMetrics);

// Overview endpoint
router.get('/metrics/overview', getMetricsOverview);

// Reset metrics endpoint
router.post('/metrics/reset', resetMetrics);

export default router; 