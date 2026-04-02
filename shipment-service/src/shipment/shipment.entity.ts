import type { BaseEntity } from "@jb226/generic-service";

export type ShipmentStatus = "PENDING" | "PROPOSED" | "ACCEPTED" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";

export interface ShipmentInterest {
  transporterId: string;
  transporterTenantId?: string;
  createdAt: Date;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Shipment extends BaseEntity {
  companyId: string;
  interests?: ShipmentInterest[];    // transporteurs ayant manifesté leur intérêt             // userId de l'expéditeur (x-user-id)
  companyTenantId?: string;      // tenantId de l'expéditeur → lookup email company-service
  transporterId?: string;        // userId du transporteur (rempli à ACCEPTED)
  transporterTenantId?: string;  // tenantId du transporteur → lookup email company-service
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
