import { BaseEntity } from "@jb226/generic-service";

export type CguStatut = "BROUILLON" | "ACTIVE" | "ARCHIVEE";

export interface CguVersion extends BaseEntity {
  version: string;      // ex : "1.0", "1.1", "2.0"
  titre: string;        // ex : "Conditions Générales d'Utilisation v1.0"
  resume: string;       // résumé des modifications (visible aux organisations)
  contenu: string;      // texte intégral des conditions
  statut: CguStatut;    // BROUILLON → ACTIVE → ARCHIVEE
  activatedAt?: Date | null;
  activatedBy?: string | null; // userId admin
  createdAt: Date;
  updatedAt: Date;
}
