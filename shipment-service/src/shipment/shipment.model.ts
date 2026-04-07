import { Schema, model } from "mongoose";
import type { Shipment } from "./shipment.entity";

const interestSchema = new Schema(
  {
    transporterId:       { type: String, required: true },
    transporterTenantId: { type: String },
    truckId:             { type: String },
    createdAt:           { type: Date, default: Date.now },
  },
  { _id: false }
);

const geoPointSchema = new Schema(
  {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const shipmentSchema = new Schema<Shipment>(
  {
    id:                  { type: String, required: true, unique: true },
    companyId:           { type: String, required: true, index: true },
    companyTenantId:     { type: String, index: true },
    transporterId:       { type: String, index: true },
    transporterTenantId: { type: String },
    truckId:             { type: String },
    driverId:            { type: String, index: true },
    dateAnnonce:         { type: Date, required: true },
    heureAnnonce:        { type: String, required: true },
    marchandise:         { type: String, required: true },
    emballage:           { type: String },
    quantite:            { type: Number, required: true },
    poids:               { type: Number, required: true },
    paysDepart:          { type: String, required: true },
    villeDepart:         { type: String, required: true },
    paysArrivee:         { type: String, required: true },
    villeArrivee:        { type: String, required: true },
    geolocDepart:        { type: geoPointSchema },
    geolocArrivee:       { type: geoPointSchema },
    prixTransport:       { type: Number },
    statut: {
      type: String,
      enum: ["PENDING", "PROPOSED", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    commentaireGeneral:    { type: String },
    commentaireAnnulation: { type: String },
    interests:             { type: [interestSchema], default: [] },
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

// Index composés pour les requêtes de matching et tri
shipmentSchema.index({ villeDepart: 1, paysDepart: 1 });
shipmentSchema.index({ companyId: 1, statut: 1 });
shipmentSchema.index({ transporterId: 1, statut: 1 });

export const ShipmentModel = model<Shipment>("Shipment", shipmentSchema);
