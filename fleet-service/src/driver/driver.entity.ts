import type { BaseEntity } from "@jb226/generic-service";

export type DriverStatus = "AVAILABLE" | "BUSY" | "SUSPENDED" | "DELETED";

export interface Driver extends BaseEntity {
  tenantId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numeroPermis: string;
  statut: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
}
