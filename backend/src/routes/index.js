import { Router } from 'express';
import authRoutes from './auth.js';
import propertyRoutes from './properties.js';
import leadRoutes from './leads.js';
import matchRoutes from './matches.js';
import landlordRoutes from './landlords.js';
import tenantRoutes from './tenants.js';
import notificationRoutes from './notifications.js';
import miscRoutes from './misc.js';
import { config } from '../config/index.js';
import { runAllJobs } from '../utils/jobs.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Optional manual/AWS EventBridge trigger. The normal AWS backend process also
// runs node-cron; this endpoint is useful for manual job runs or external schedulers.
router.get('/cron', async (req, res) => {
  if (config.cronSecret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${config.cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  try {
    await runAllJobs();
    res.json({ ok: true, ranAt: new Date().toISOString() });
  } catch (err) {
    console.error('[cron] error', err);
    res.status(500).json({ error: err.message });
  }
});
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/leads', leadRoutes);
router.use('/matches', matchRoutes);
router.use('/landlords', landlordRoutes);
router.use('/tenants', tenantRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', miscRoutes);

export default router;
