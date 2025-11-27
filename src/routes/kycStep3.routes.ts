import { Router } from 'express';
import { kycStep3 } from '../controllers/kycStep3.controller';
import multer from 'multer';
import { authMiddleware } from '../middlewares/auth';

const upload = multer({ dest: 'uploads/temp/' });
const router = Router();

router.post(
  '/step3',
  authMiddleware,
  upload.any(),
  kycStep3
);

export default router;
