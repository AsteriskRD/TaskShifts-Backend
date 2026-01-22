import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;             // e.g. "kyc_approve", "kyc_reject"
  targetId: mongoose.Types.ObjectId;  // providerId
  targetType: string;         // "provider"
  details: Record<string, any>;
  reason?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  targetType: { type: String, default: 'provider' },
  details: { type: Schema.Types.Mixed, default: {} },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
