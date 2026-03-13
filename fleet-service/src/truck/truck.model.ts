import { Schema, model } from "mongoose";
import type { Truck } from "./truck.entity";

const truckSchema = new Schema<Truck>(
  {
    id:             { type: String, required: true, unique: true },
    tenantId:       { type: String, required: true, index: true },
    immatriculation:{ type: String, required: true, unique: true },
    chassis:        { type: String, required: true, unique: true },
    marque:         { type: String, required: true },
    modele:         { type: String, required: true },
    typeVehicule:   { type: String, required: true },
    carrosserie:    { type: String },
    gabarit:        { type: String },
    capaciteMax:    { type: Number, required: true },
    photoUrl:       { type: String },
    statut: {
      type: String,
      enum: ["AVAILABLE", "BUSY", "MAINTENANCE"],
      default: "AVAILABLE",
      index: true,
    },
    driverId:  { type: String },
    villeBase: { type: String, required: true },
    paysBase:  { type: String, required: true },
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

// Index composés pour les requêtes fréquentes
truckSchema.index({ tenantId: 1, statut: 1 });
truckSchema.index({ tenantId: 1, villeBase: 1, paysBase: 1 });
truckSchema.index({ villeBase: 1, paysBase: 1 });
// Index optimisé pour findMatching : champs d'égalité d'abord, champ de range (capaciteMax) en dernier
truckSchema.index({ statut: 1, villeBase: 1, paysBase: 1, capaciteMax: 1 }, { name: 'trucks_findMatching' });

export const TruckModel = model<Truck>("Truck", truckSchema);
