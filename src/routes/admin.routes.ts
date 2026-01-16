import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

import {
  getPendingKyc,
  getKycDetails,
  approveKyc,
  rejectKyc,
} from '../controllers/adminKycController';

const router = Router();

router.use(verifyToken, isAdmin); // protect all admin routes

router.get('/kyc/pending', getPendingKyc);
router.get('/kyc/:providerId/details', getKycDetails);
router.patch('/kyc/:providerId/approve', approveKyc);
router.patch('/kyc/:providerId/reject', rejectKyc);

export default router;
