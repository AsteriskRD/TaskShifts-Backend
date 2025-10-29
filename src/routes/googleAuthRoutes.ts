import express from 'express';
import { googleSignup, googleLogin } from '../controllers/googleAuthController';

const router = express.Router();

router.post('/signup', googleSignup);
router.post('/login', googleLogin);

export default router;
