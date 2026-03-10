import type { BaseEntity } from "@jb226/generic-service";

export type TruckStatus = "AVAILABLE" | "BUSY" | "MAINTENANCE";

export interface Truck extends BaseEntity {
  tenantId: string;
  immatriculation: string;
  chassis: string;
  marque: string;
  modele: string;
  typeVehicule: string;
  carrosserie?: string;
  gabarit?: string;
  capaciteMax: number;
  photoUrl?: string;
  statut: TruckStatus;
  driverId?: string;
  villeBase: string;
  paysBase: string;
  createdAt: Date;
  updatedAt: Date;
}
