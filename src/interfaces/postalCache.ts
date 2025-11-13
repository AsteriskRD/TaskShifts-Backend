import { Document } from 'mongoose';

export interface IPostalCache extends Document {
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  provider: 'opencage' | 'google';
  createdAt?: Date;
  updatedAt?: Date;
}
