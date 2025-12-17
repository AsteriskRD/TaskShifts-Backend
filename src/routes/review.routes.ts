// src/routes/review.routes.ts
import { Router } from 'express';
import { createReview, getProviderReviews } from '../controllers/reviewController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// POST /api/reviews - Create review (protected)
router.post('/', verifyToken, createReview);

// GET /api/reviews/provider/:providerId - Get provider reviews (public)
router.get('/provider/:providerId', getProviderReviews);

export default router;
