import { Router } from 'express';
import { rewrite } from '../controllers/rewriteController';

const router = Router();

router.post('/rewrite', rewrite);

export default router;