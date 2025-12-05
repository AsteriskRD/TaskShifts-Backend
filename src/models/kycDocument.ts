import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IKycDocument extends Document {
  providerId: Types.ObjectId;
  documentType:
    | 'businessRegistration'
    | 'proofOfAddress'
    | 'proofOfIdentity';
  // Specific fields
  businessRegistrationType?: string;  // for business
  registrationNumber?: string;        // for business
  proofOfAddressType?: string;        // e.g. "Utility Bill"
  proofOfIdentityType?: string;       // for identity
  idNumber?: string;                 // for identity
  side?: 'front' | 'back';            // only for identity card
  fileUrl: string;                    // Cloudinary URL
  filePublicId: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  uploadedAt: Date;
  verifiedAt?: Date;
}

const KycDocumentSchema = new Schema<IKycDocument>({
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  documentType: {
    type: String,
    enum: ['businessRegistration', 'proofOfAddress', 'proofOfIdentity'],
    required: true,
  },
  businessRegistrationType: { type: String },
  registrationNumber: { type: String },
  proofOfAddressType: { type: String },
  proofOfIdentityType: { type: String },
  idNumber: { type: String },
  side: { type: String, enum: ['front', 'back'] },
  fileUrl: { type: String, required: true },
  filePublicId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  rejectionReason: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
});

export const KycDocumentModel = mongoose.model<IKycDocument>('KycDocument', KycDocumentSchema);
