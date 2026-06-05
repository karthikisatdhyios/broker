import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  createProperty, listProperties, getProperty, myProperties,
  refreshProperty, updateProperty, markRented, deleteProperty,
} from '../controllers/propertyController.js';

const router = Router();
router.use(requireAuth);

router.get('/', listProperties);
router.get('/mine', myProperties);
router.post('/', upload.array('photos', 6), createProperty);
router.get('/:id', getProperty);
router.patch('/:id', updateProperty);
router.post('/:id/refresh', refreshProperty);
router.post('/:id/rent', markRented);
router.delete('/:id', deleteProperty);

export default router;
