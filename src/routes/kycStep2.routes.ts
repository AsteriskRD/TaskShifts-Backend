import { Router } from 'express';
import { kycStep2 } from '../controllers/kycStep2.controller';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth';

const upload = multer({ dest: 'uploads/temp/' });

const router = Router();

// POST /api/kyc/step2
// Form-data fields:
//   - documentType: "businessRegistration" or "proofOfAddress"
//   - registrationNumber: optional string
//   - file: the PDF/image
router.post(
  '/step2',
  authMiddleware,
  upload.single('file'), // field name = "file"
  kycStep2
);

export default router;
