import express from 'express';
import { completeProfile, getProfile, updateProfile } from '../controllers/profileController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Only logged-in users (with JWT) can complete and get their profile
router.post('/complete-profile', verifyToken, completeProfile);
router.get('/get-profile', verifyToken, getProfile);
router.post('/update-profile', verifyToken, updateProfile);

export default router;
