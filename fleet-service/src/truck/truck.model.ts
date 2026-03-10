import { Schema, model } from "mongoose";
import type { Truck } from "./truck.entity";

const truckSchema = new Schema<Truck>(
  {
    id: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true },
    immatriculation: { type: String, required: true, unique: true },
    chassis: { type: String, required: true, unique: true },
    marque: { type: String, required: true },
    modele: { type: String, required: true },
    typeVehicule: { type: String, required: true },
    carrosserie: { type: String },
    gabarit: { type: String },
    capaciteMax: { type: Number, required: true },
    photoUrl: { type: String },
    statut: {
      type: String,
      enum: ["AVAILABLE", "BUSY", "MAINTENANCE"],
      default: "AVAILABLE",
    },
    driverId: { type: String },
    villeBase: { type: String, required: true },
    paysBase: { type: String, required: true },
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

export const TruckModel = model<Truck>("Truck", truckSchema);
