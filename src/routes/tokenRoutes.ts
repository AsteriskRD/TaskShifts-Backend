import express from 'express';
import { refreshAccessToken } from '../middleware/auth';
const router = express.Router();

router.post('/refresh-token', refreshAccessToken);

export default router;
