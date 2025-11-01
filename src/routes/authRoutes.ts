import express from 'express';
import { register, login, verifyEmail, logout } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/logout', verifyToken, logout);

export default router;
