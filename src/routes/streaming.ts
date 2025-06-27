import { Router } from 'express';
import { streamRewrite, streamMockRewrite } from '../controllers/streamingController';

const router = Router();

// Stream rewrite with any LLM (OpenAI, Anthropic, or Local Mock)
router.post('/rewrite/stream', streamRewrite);

// Stream rewrite with local mock only (for testing)
router.post('/rewrite/stream/mock', streamMockRewrite);

export default router; 