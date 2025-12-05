import { Router } from 'express';
import { kycStep1, getKycStep1Data, updateKycStep1Data } from '../controllers/kycStep1.controller';
import multer from 'multer';
import { verifyToken } from '../middleware/auth';

const upload = multer({ dest: 'uploads/temp/' }); // temp folder

const router = Router();

// POST /api/kyc/step1
// Accepts form-data: text fields + single file (profilePicture)
router.post(
  '/step1',
  verifyToken,
  upload.single('profilePicture'), // accepts file named "profilePicture"
  kycStep1
);
router.get(
  '/step1/data',
  verifyToken,
  getKycStep1Data
);
router.patch(
  '/step1/update', 
  verifyToken, 
  upload.single('profilePicture'),  // accepts file named "profilePicture"
  updateKycStep1Data
);

export default router;
