import type { BaseEntity } from "@jb226/generic-service";

export interface TrackingPoint extends BaseEntity {
  truckId: string;
  shipmentId: string;
  latitude: number;
  longitude: number;
  vitesse?: number; // km/h
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}
