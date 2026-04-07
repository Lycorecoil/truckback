import type { BaseEntity } from "@jb226/generic-service";

export type TruckStatus = "AVAILABLE" | "BUSY" | "MAINTENANCE";

export interface TruckPhotos {
  gauche?: string;
  droite?: string;
  avant?: string;
}

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
  photos?: TruckPhotos;
  statut: TruckStatus;
  driverId?: string;
  villeBase: string;
  paysBase: string;
  createdAt: Date;
  updatedAt: Date;
}
