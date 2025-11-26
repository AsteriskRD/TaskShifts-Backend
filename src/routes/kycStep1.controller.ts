import { Router } from 'express';
import { kycStep1 } from '../controllers/kycStep1.controller';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth';

const upload = multer({ dest: 'uploads/temp/' }); // temp folder

const router = Router();

// POST /api/kyc/step1
// Accepts form-data: text fields + single file (profilePicture)
router.post(
  '/step1',
  authMiddleware,
  upload.single('profilePicture'), // field name in frontend form
  kycStep1
);

export default router;
