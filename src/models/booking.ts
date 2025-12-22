import mongoose, { Schema } from "mongoose";
import { IBooking } from "../interfaces/booking";
import { LocationDetails, IServiceRender } from "../interfaces/user";


const LocationSchema: Schema = new Schema<LocationDetails>({
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, trim: true, uppercase: true },
  coordinates: { type: [Number], index: '2dsphere' }, // For geospatial matching
});

const ServiceRenderSubSchema: Schema = new Schema<IServiceRender>({
  serviceType: { type: String },
  category: { type: String },
  subcategory: { type: String },
  description: { type: String },
  skills: [{
    area: { type: String },
    level: { type: String },
    experience: { type: String }
  }],
  packages: [{
    name: { type: String },
    price: { type: Number },
    currency: { type: String, default: '' },
    deliveryTime: { type: String },
    description: { type: String }
  }],
  portfolio: [{
    filePath: { type: String }, // Cloudinary URL
    skillLevel: { type: String },
    experience: { type: String },
    description: { type: String }
  }],
  additionalSettings: {
    serviceDescription: { type: String },
    cancellationPolicy: { type: String }
  },
  agreeToTerms: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BookingSchema = new Schema<IBooking>({
    clientId: { type: String, required: true, unique: true},
    providerId: { type: String, required: true, unique: true},
    clientLocation: LocationSchema,
    clientName: { type: String, required: true, trim: true},
    dateOfBooking: { type: Date, default: null },
    providerService: ServiceRenderSubSchema,
});

export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);