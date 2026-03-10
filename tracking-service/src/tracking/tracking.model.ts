import mongoose, { Schema } from "mongoose";
import type { TrackingPoint } from "./tracking.entity";

const trackingPointSchema = new Schema<TrackingPoint>(
  {
    id: { type: String, required: true, unique: true },
    truckId: { type: String, required: true },
    shipmentId: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    vitesse: { type: Number },
    timestamp: { type: Date, required: true },
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

export const TrackingPointModel = mongoose.model<TrackingPoint>(
  "TrackingPoint",
  trackingPointSchema
);
