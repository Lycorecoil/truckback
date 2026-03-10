import { Schema, model } from "mongoose";
import type { Shipment } from "./shipment.entity";

const geoPointSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const shipmentSchema = new Schema<Shipment>(
  {
    id: { type: String, required: true, unique: true },
    companyId: { type: String, required: true },
    transporterId: { type: String },
    truckId: { type: String },
    driverId: { type: String },
    dateAnnonce: { type: Date, required: true },
    heureAnnonce: { type: String, required: true },
    marchandise: { type: String, required: true },
    emballage: { type: String },
    quantite: { type: Number, required: true },
    poids: { type: Number, required: true },
    paysDepart: { type: String, required: true },
    villeDepart: { type: String, required: true },
    paysArrivee: { type: String, required: true },
    villeArrivee: { type: String, required: true },
    geolocDepart: { type: geoPointSchema },
    geolocArrivee: { type: geoPointSchema },
    prixTransport: { type: Number },
    statut: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    commentaireGeneral: { type: String },
    commentaireAnnulation: { type: String },
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

export const ShipmentModel = model<Shipment>("Shipment", shipmentSchema);
