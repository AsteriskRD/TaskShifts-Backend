import express from 'express';
import { booking } from '../controllers/bookingController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.post('/', verifyToken, booking);

export default router;