import { Router } from 'express';
import authRoutes from './auth.js';
import propertyRoutes from './properties.js';
import leadRoutes from './leads.js';
import matchRoutes from './matches.js';
import landlordRoutes from './landlords.js';
import tenantRoutes from './tenants.js';
import notificationRoutes from './notifications.js';
import miscRoutes from './misc.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/leads', leadRoutes);
router.use('/matches', matchRoutes);
router.use('/landlords', landlordRoutes);
router.use('/tenants', tenantRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', miscRoutes);

export default router;
