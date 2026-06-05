import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listTenants, createTenant, updateTenant, deleteTenant,
  renewalWatchlist, markRenewalContacted,
} from '../controllers/tenantController.js';

const router = Router();
router.use(requireAuth);

router.get('/', listTenants);
router.get('/renewals', renewalWatchlist);
router.post('/', createTenant);
router.patch('/:id', updateTenant);
router.post('/:id/renewal-contacted', markRenewalContacted);
router.delete('/:id', deleteTenant);

export default router;
