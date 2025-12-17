// src/controllers/reviewController.ts
import { Request, Response } from 'express';
import { ReviewModel } from '../models/review';
import { findProviderById, findClientById } from '../utils/userUtils';

// POST /api/reviews - Create a review (client reviews provider)
export const createReview = async (req: Request, res: Response) => {
  try {
    const clientId = (req as any).user.id;
    const { providerId, rating, comment } = req.body;

    if (!providerId || !rating) {
      return res.status(400).json({ message: 'Provider ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const client = await findClientById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Optional: Prevent duplicate reviews (one per client-provider pair)
    const existingReview = await ReviewModel.findOne({ clientId, providerId });
    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this provider' });
    }

    const review = new ReviewModel({
      providerId,
      clientId,
      rating,
      comment: comment?.trim(),
    });

    await review.save();

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      },
    });
  } catch (error: any) {
      console.error('Create review error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/reviews/provider/:providerId - Get all reviews for a provider
export const getProviderReviews = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const provider = await findProviderById(providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const [reviews, total] = await Promise.all([
      ReviewModel.find({ providerId })
        .populate('clientId', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReviewModel.countDocuments({ providerId }),
    ]);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        averageRating: Number(avgRating.toFixed(2)),
        totalReviews: total,
      },
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
