import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  userId: string;
  email: string;
  passwordHash?: string; // optional for Google users
  googleId?: string; // optional for email user
  userType: 'client' | 'provider';
  isVerified: boolean;
  isProfileComplete: boolean;
  termsAccepted: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isPremium: boolean; // For revenue features (subscriptions)
  isKyc: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationDetails {
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  postalCode?: string;
  coordinates?: [number, number]; // Longitude, latitude for geospatial matching
}

export interface IClient extends IUser {
  firstName: string;
  lastName: string;
  phone?: string;
  alternatePhone?: string;
  gender?: string;
  dateOfBirth?: Date;
  location?: LocationDetails;
}

export interface IProvider extends IUser {
  firstName: string;
  lastName: string;
  phone?: string;
  alternatePhone?: string;
  gender?: string;
  dateOfBirth?: Date;
  location?: LocationDetails;
  service?: {
    serviceCategory?: string;
    registrationStatus?: string;
    businessName?: string;
    website?: string; // Optional per UI
    serviceDescription?: string;
  };
  availability: boolean; // For matching available providers
}
