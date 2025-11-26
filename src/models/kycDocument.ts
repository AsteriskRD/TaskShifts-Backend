import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IKycDocument extends Document {
  providerId: Types.ObjectId;           // references the Provider (User._id)
  documentType: 'businessRegistration' | 'proofOfAddress';
  registrationNumber?: string;          // for business reg (e.g. CAC number)
  fileUrl: string;                      // Cloudinary secure_url
  filePublicId: string;                 // for deletion later if needed
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
    enum: ['businessRegistration', 'proofOfAddress'],
    required: true,
  },
  registrationNumber: { type: String },
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
