import mongoose, { Schema } from 'mongoose';
import { IPostalCache } from "../interfaces/postalCache";

const PostalCacheSchema = new Schema<IPostalCache>(
  {
    postalCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    provider: {
      type: String,
      enum: ['opencage', 'google'],
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure unique postalCode + country combo
PostalCacheSchema.index({ country: 1, postalCode: 1 }, { unique: true });
// 180 days TTL
PostalCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

export const PostalCache = mongoose.model<IPostalCache>('PostalCache', PostalCacheSchema);
