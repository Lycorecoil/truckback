import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
  id: string;
  tenantId: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["ADMIN", "COMPANY", "TRANSPORTER", "DRIVER"] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, versionKey: false },
);

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);
