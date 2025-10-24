import express from 'express';
import { register, verifyEmail } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);

export default router;
