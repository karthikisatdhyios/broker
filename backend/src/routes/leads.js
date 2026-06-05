import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createLead, listLeads, myLeads, updateLead, deleteLead, convertLead,
} from '../controllers/leadController.js';

const router = Router();
router.use(requireAuth);

router.get('/', listLeads);
router.get('/mine', myLeads);
router.post('/', createLead);
router.patch('/:id', updateLead);
router.post('/:id/convert', convertLead);
router.delete('/:id', deleteLead);

export default router;
