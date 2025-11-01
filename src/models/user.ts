import mongoose, { Schema } from 'mongoose';
import { IUser, IClient, IProvider, LocationDetails } from '../interfaces/user';

const UserSchema: Schema = new Schema<IUser>({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: () => `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  userType: {
    type: String,
    enum: ['client', 'provider'],
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  termsAccepted: {
    type: Boolean,
    default: true,
  },
  verificationCode: {
    type: String,
  },
  verificationCodeExpires: {
    type: Date,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  isKyc: {
    type: Boolean,
    default: false,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

const LocationSchema: Schema = new Schema<LocationDetails>({
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, trim: true, uppercase: true },
  coordinates: { type: [Number], index: '2dsphere' }, // For geospatial matching
});

const ClientSchema: Schema = new Schema<IClient>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  location: LocationSchema,
}, { discriminatorKey: 'userType' });

const ProviderSchema: Schema = new Schema<IProvider>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  service: {
    serviceCategory: { type: String, required: true },
    registrationStatus: { type: String, required: true },
    businessName: { type: String, required: true },
    website: { type: String },
    serviceDescription: { type: String, required: true },
  },
  availability: { type: Boolean, default: true },
  location: LocationSchema,
}, { discriminatorKey: 'userType' });

export const ClientModel = UserModel.discriminator<IClient>('Client', ClientSchema);
export const ProviderModel = UserModel.discriminator<IProvider>('Provider', ProviderSchema);
