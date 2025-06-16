import { Router } from 'express';
import { rewrite } from '../controllers/rewriteController';

const router = Router();

router.post('/v1/rewrite', rewrite);

export default router;