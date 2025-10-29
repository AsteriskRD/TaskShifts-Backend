import { Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  email: string;
  passwordHash: string;
  userType: 'client' | 'provider';
  isVerified: boolean;
  termsAccepted: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  isPremium: boolean; // For revenue features (subscriptions)
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationDetails {
  address: string;
  city: string;
  country: string;
  state: string;
  postalCode?: string;
  coordinates?: [number, number]; // Longitude, latitude for geospatial matching
}

export interface IClient extends IUser {
  firstName: string;
  lastName: string;
  phone?: string;
  location: LocationDetails;
}

export interface IProvider extends IUser {
  firstName: string;
  lastName: string;
  phone?: string;
  location?: LocationDetails;
  service: {
    serviceCategory: string;
    registrationStatus: string;
    businessName: string;
    website?: string; // Optional per UI
    serviceDescription: string;
  };
  availability: boolean; // For matching available providers
}
