import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  userId: string;
  email: string;
  passwordHash?: string; // optional for Google users
  googleId?: string; // optional for email user
  userType: 'client' | 'provider';
  userRole?: 'user' | 'admin';
  isVerified: boolean;
  isProfileComplete: boolean;
  termsAccepted: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isPremium: boolean; // For revenue features (subscriptions)
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

export interface IServiceRender {
  serviceType: string;
  category: string;
  subcategory: string;
  description: string;
  skills: { area: string; level: string; experience: string }[];
  packages: { name: string; price: number; currency: string; deliveryTime: string; description: string }[];
  portfolio: { filePath: string; skillLevel: string; experience: string; description: string }[];
  additionalSettings: {
    serviceDescription: string;
    cancellationPolicy: string;
  };
  agreeToTerms: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IKycProgress {
  currentStep: 1 | 2 | 3;
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
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
  bio?: string; // Added from KYC Step 1
  profilePicture?: string; // Added from KYC Step 1 (Cloudinary URL)
  kycStatus?: 'incomplete' | 'pending' | 'verified' | 'rejected'; // Added for detailed KYC tracking
  kycProgress: IKycProgress;
  servicesRender: IServiceRender[]; // Added array for multiple services (renamed to avoid conflict)
  accountVisibility?: 'public' | 'private';
  notificationPreferences?: {
    app: boolean;
    email: boolean;
    sound: boolean;
    vibration: boolean;
    autoReplyEnabled: boolean;
  };
  preferences?: {
    language: string;
    country: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
  };
}
