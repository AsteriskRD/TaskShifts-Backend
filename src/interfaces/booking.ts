import { Document, Types } from 'mongoose';
import { LocationDetails } from './user';
import { IServiceRender } from "./user";

export interface IBooking extends Document {
    _id: Types.ObjectId,
    clientId: string,
    providerId: string,
    clientLocation: LocationDetails,
    clientName: string,
    DateofBooking: Date,
    providerService: IServiceRender 
}