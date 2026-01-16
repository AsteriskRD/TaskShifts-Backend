import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { updateAvailability } from '../controllers/providerController';

const router = Router();

// Toggle or set provider availability
router.patch('/availability', verifyToken, updateAvailability);

export default router;
