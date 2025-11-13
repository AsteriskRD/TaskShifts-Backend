import mongoose, { Schema } from 'mongoose';
import { IKyc } from '../interfaces/kyc';

const kycSchema = new Schema<IKyc>(
    {
        personalInformation: {
            firstName: { type: String, required: true, trim: true },
            lastName: { type: String, required: true, trim: true },
            phoneNumber: { type: String, required: true, trim: true  },
            email: { type: String, required: true, trim: true, lowercase: true },   
            bio: { type: String, required: true, trim: true },
            imageUrl: { type: String, trim: true },
            isActive: { type: Boolean, default: true },
        },

        documentVerification: {
            type: { type: String, required: true },
            registrationNumber: { type: String, required: true, trim: true },
            businessRegDocumentUrl: { type: String, trim: true }
        },

        businessAddressVerification: {
            type: { type: String, required: true },
            documentUrl: { type: String, required: true, trim: true }
        },

        identityVerification: {
            type: { type: String, required: true },
            documentNumber: { type: String, required: true, trim: true },
            frontImageUrl: { type: String, required: true, trim: true },
            backImageUrl: { type: String, trim: true },
            confirmationStatus: { type: Boolean, default: false }
        }
    }
)

const KycModel = mongoose.model<IKyc>('KycModel', kycSchema);

export default KycModel;