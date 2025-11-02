import express from 'express';
import {
  register,
  login,
  verifyEmail,
  logout,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/logout', verifyToken, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', verifyToken, changePassword);

export default router;
