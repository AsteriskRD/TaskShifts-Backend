import { Request, Response } from 'express';
import { ProviderModel } from '../models/user';
import { ReviewModel } from '../models/review';

export const searchProviders = async (req: Request, res: Response) => {
  try {
    const {
      search = '',
      category = '',
      location = '',
      priceMin,
      priceMax,
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build match conditions
    const match: any = {
      userType: 'provider',
      kycStatus: 'verified', // ONLY verified providers
    };

    if (search) {
      match.$text = { $search: search as string };
    }

    if (category) {
      match['servicesRender.category'] = { $regex: category as string, $options: 'i' };
    }

    if (location) {
      match['location.city'] = { $regex: location as string, $options: 'i' };
    }

    const pipeline: any[] = [
      { $match: match },

      // Unwind services so we can filter inside
      { $unwind: '$servicesRender' },

      // Optional price filter on packages
      ...(priceMin || priceMax
        ? [
            {
              $match: {
                'servicesRender.packages.price': {
                  ...(priceMin && { $gte: Number(priceMin) }),
                  ...(priceMax && { $lte: Number(priceMax) }),
                },
              },
            },
          ]
        : []),

      // Lookup average rating
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'providerId',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          avgRating: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $avg: '$reviews.rating' },
              else: 0,
            },
          },
          reviewCount: { $size: '$reviews' },
        },
      },

      // Project only what frontend needs
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          profilePicture: 1,
          bio: 1,
          'location.city': 1,
          'location.state': 1,
          serviceType: '$servicesRender.serviceType',
          category: '$servicesRender.category',
          subcategory: '$servicesRender.subcategory',
          startingPrice: {
            $min: '$servicesRender.packages.price',
          },
          portfolioSample: {
            $ifNull: [{ $arrayElemAt: ['$servicesRender.portfolio.filePath', 0] }, null],
          },
          avgRating: 1,
          reviewCount: 1,
        },
      },

      // Group back by provider (in case of multiple services)
      {
        $group: {
          _id: '$_id',
          firstName: { $first: '$firstName' },
          lastName: { $first: '$lastName' },
          profilePicture: { $first: '$profilePicture' },
          bio: { $first: '$bio' },
          city: { $first: '$location.city' },
          state: { $first: '$location.state' },
          services: {
            $push: {
              serviceType: '$serviceType',
              category: '$category',
              subcategory: '$subcategory',
              startingPrice: '$startingPrice',
              portfolioSample: '$portfolioSample',
            },
          },
          avgRating: { $first: '$avgRating' },
          reviewCount: { $first: '$reviewCount' },
        },
      },

      // Sort by rating or relevance
      { $sort: { avgRating: -1, _id: -1 } },

      // Pagination
      { $skip: skip },
      { $limit: limitNum },
    ];

    const providers = await ProviderModel.aggregate(pipeline);

    const total = await ProviderModel.aggregate([
      ...pipeline.slice(0, -2), // remove skip & limit
      { $count: 'total' },
    ]);

    const totalCount = total[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: providers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Search failed', error: error.message });
  }
};
