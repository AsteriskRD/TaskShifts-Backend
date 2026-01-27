import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  sentAt: Date;
  readAt?: Date;          // null until read
  isRead: boolean;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  sentAt: { type: Date, default: Date.now },
  readAt: { type: Date },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
