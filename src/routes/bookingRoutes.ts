import express from 'express';
import { booking } from '../controllers/bookingController';

const router = express.Router();

router.post('/', booking);

export default router;