import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createMatch, listMatches, respondMatch, postMessage,
} from '../controllers/matchController.js';

const router = Router();
router.use(requireAuth);

router.get('/', listMatches);
router.post('/', createMatch);
router.post('/:id/respond', respondMatch);
router.post('/:id/messages', postMessage);

export default router;
