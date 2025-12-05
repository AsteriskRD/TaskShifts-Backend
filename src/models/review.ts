import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  providerId: Types.ObjectId;
  clientId: Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const ReviewModel = mongoose.model<IReview>('Review', ReviewSchema);
