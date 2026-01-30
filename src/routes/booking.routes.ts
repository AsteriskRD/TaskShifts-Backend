import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  createBooking,
  getMyBookings,
  rescheduleBooking,
  cancelBooking,
  acceptBooking,
  completeBooking,
} from '../controllers/bookingController';

const router = Router();

router.post('/', verifyToken, createBooking);                // Client only
router.get('/my', verifyToken, getMyBookings);              // Client or provider
router.patch('/:bookingId/reschedule', verifyToken, rescheduleBooking);
router.patch('/:bookingId/cancel', verifyToken, cancelBooking);
router.patch('/:bookingId/accept', verifyToken, acceptBooking);     // Provider only
router.patch('/:bookingId/complete', verifyToken, completeBooking); // Provider only

export default router;
