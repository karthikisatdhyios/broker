import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { register, login, me, updateProfile } from '../controllers/authController.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateProfile);
export default router;
