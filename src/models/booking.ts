import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  clientId: Types.ObjectId;
  providerId: Types.ObjectId;
  serviceId: Types.ObjectId; // Reference to one service in servicesRender
  date: Date;
  duration: number; // in minutes
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  cancellationReason?: string;
  rescheduleReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true, min: 30 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending',
  },
  notes: { type: String },
  cancellationReason: { type: String },
  rescheduleReason: { type: String },
}, { timestamps: true });

export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);
