import mongoose, { Schema, Document } from "mongoose";

export interface TemplateDocument extends Document {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
}

const TemplateSchema = new Schema<TemplateDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    channel: { type: String, required: true, enum: ["EMAIL", "SMS", "PUSH"] },
    subject: { type: String },
    body: { type: String, required: true },
  },
  { versionKey: false, toJSON: { transform: (_doc, ret: Record<string, unknown>) => { delete ret["_id"]; } } },
);

export const TemplateModel = mongoose.model<TemplateDocument>("NotificationTemplate", TemplateSchema);
