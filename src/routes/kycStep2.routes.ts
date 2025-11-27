import { Router } from 'express';
import { kycStep2 } from '../controllers/kycStep2.controller';
import multer from 'multer';
import { authMiddleware from '../middlewares/auth';

const upload = multer({ dest: 'uploads/temp/' });

const router = Router();

router.post(
  '/step2',
  authMiddleware,
  upload.fields([
    { name: 'businessDoc', maxCount: 1 },
    { name: 'addressDoc', maxCount: 1 },
    { name: 'identityFront', maxCount: 1 },
    { name: 'identityBack', maxCount: 1 },
  ]),
  kycStep2
);

export default router;
