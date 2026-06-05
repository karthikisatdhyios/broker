import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { subscribe, cancelSubscription } from '../controllers/subscriptionController.js';
import { geocodeAddress } from '../utils/geocode.js';

const router = Router();

router.post('/subscription/subscribe', requireAuth, subscribe);
router.post('/subscription/cancel', requireAuth, cancelSubscription);

// Geocoding helper for the property form (live preview of the pin).
router.get('/geocode', requireAuth, async (req, res) => {
  const { address, city } = req.query;
  if (!address) return res.status(400).json({ error: 'address is required' });
  const loc = await geocodeAddress(address, city || '');
  if (!loc) return res.status(404).json({ error: 'No results for that address' });
  res.json({ location: loc });
});

export default router;
