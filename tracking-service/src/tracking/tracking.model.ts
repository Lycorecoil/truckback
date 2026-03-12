import mongoose, { Schema } from "mongoose";
import type { TrackingPoint } from "./tracking.entity";

const trackingPointSchema = new Schema<TrackingPoint>(
  {
    id:         { type: String, required: true, unique: true },
    truckId:    { type: String, required: true, index: true },
    shipmentId: { type: String, required: true, index: true },
    latitude:   { type: Number, required: true },
    longitude:  { type: Number, required: true },
    vitesse:    { type: Number },
    timestamp:  { type: Date, required: true },
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

// Index composé critique : findLatestByTruckId utilise ce tri très fréquemment
trackingPointSchema.index({ truckId: 1, timestamp: -1 });
// Index composé pour les requêtes d'historique par expédition
trackingPointSchema.index({ shipmentId: 1, timestamp: -1 });

export const TrackingPointModel = mongoose.model<TrackingPoint>(
  "TrackingPoint",
  trackingPointSchema
);
