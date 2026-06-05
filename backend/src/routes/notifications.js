import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listNotifications, markRead, markAllRead,
} from '../controllers/notificationController.js';

const router = Router();
router.use(requireAuth);

router.get('/', listNotifications);
router.post('/read-all', markAllRead);
router.post('/:id/read', markRead);

export default router;
