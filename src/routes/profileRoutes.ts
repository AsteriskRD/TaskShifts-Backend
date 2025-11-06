import express from 'express';
import { completeProfile, getProfile } from '../controllers/profileController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Only logged-in users (with JWT) can complete and get their profile
router.post('/complete-profile', verifyToken, completeProfile);
router.get('/get-profile', verifyToken, getProfile);

export default router;
