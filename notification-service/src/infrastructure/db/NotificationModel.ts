import mongoose, { Schema, Document } from "mongoose";

export interface NotificationDocument extends Document {
  id: string;
  recipientId: string;
  channel: string;
  message: string;
  status: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    id: { type: String, required: true, unique: true },
    recipientId: { type: String, required: true, index: true },
    channel: { type: String, required: true, enum: ["EMAIL", "SMS", "PUSH"] },
    message: { type: String, required: true },
    status: { type: String, required: true, enum: ["SENT", "FAILED"] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, versionKey: false },
);

export const NotificationModel = mongoose.model<NotificationDocument>("Notification", NotificationSchema);
