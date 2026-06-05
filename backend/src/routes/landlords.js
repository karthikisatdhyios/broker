import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listLandlords, createLandlord, updateLandlord, deleteLandlord,
} from '../controllers/landlordController.js';

const router = Router();
router.use(requireAuth);

router.get('/', listLandlords);
router.post('/', createLandlord);
router.patch('/:id', updateLandlord);
router.delete('/:id', deleteLandlord);

export default router;
