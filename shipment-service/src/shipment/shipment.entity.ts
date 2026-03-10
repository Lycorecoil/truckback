import type { BaseEntity } from "@jb226/generic-service";

export type ShipmentStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Shipment extends BaseEntity {
  companyId: string;           // tenantId de l'expéditeur
  transporterId?: string;      // tenantId du transporteur (rempli à ACCEPTED)
  truckId?: string;            // id du camion assigné
  driverId?: string;           // id du chauffeur assigné
  dateAnnonce: Date;
  heureAnnonce: string;        // format "HH:MM"
  marchandise: string;
  emballage?: string;
  quantite: number;
  poids: number;               // requis pour le matching
  paysDepart: string;
  villeDepart: string;
  paysArrivee: string;
  villeArrivee: string;
  geolocDepart?: GeoPoint;
  geolocArrivee?: GeoPoint;
  prixTransport?: number;
  statut: ShipmentStatus;
  commentaireGeneral?: string;
  commentaireAnnulation?: string;
  createdAt: Date;
  updatedAt: Date;
}
