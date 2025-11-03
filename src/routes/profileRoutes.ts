import express from 'express';
import { completeProfile } from '../controllers/profileController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Only logged-in users (with JWT) can complete their profile
router.post('/complete-profile', verifyToken, completeProfile);

export default router;
