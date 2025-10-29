import express from 'express';
import { completeClientProfile } from '../controllers/profileController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Only logged-in users (with JWT) can complete their profile
router.post('/complete-profile', verifyToken, completeClientProfile);

export default router;
