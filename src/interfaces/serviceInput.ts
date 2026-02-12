import { Document } from 'mongoose';

export interface IServiceInput extends Document {
  serviceType: string;
  category: string;
  subcategory: string;
  description: string;
  skills: { area: string; level: string; experience: string }[];
  packages: {
    name: string;
    price: number;
    currency: string;
    deliveryTime: string;
    description: string;
  }[];
  portfolio: {
    file: Express.Multer.File;
    skillLevel: string;
    experience: string;
    description: string;
  }[];
  additionalSettings: {
    serviceDescription: string;
    cancellationPolicy: string;
  };
  agreeToTerms: boolean;
}
