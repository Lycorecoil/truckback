import { Schema, model } from "mongoose";
import type { Driver } from "./driver.entity";

const driverSchema = new Schema<Driver>(
  {
    id: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telephone: { type: String, required: true },
    numeroPermis: { type: String, required: true, unique: true },
    statut: {
      type: String,
      enum: ["AVAILABLE", "BUSY", "SUSPENDED"],
      default: "AVAILABLE",
    },
    oneSignalPlayerId: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret["_id"];
        delete ret["__v"];
      },
    },
  }
);

export const DriverModel = model<Driver>("Driver", driverSchema);
