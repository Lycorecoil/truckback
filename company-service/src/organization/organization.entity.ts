import { BaseEntity } from "@jb226/generic-service";

export type OrganizationType = "COMPANY" | "TRANSPORTER";
export type OrganizationStatut = "ACTIVE" | "SUSPENDED";

export interface Organization extends BaseEntity {
  tenantId: string; // lien avec le User du Auth Service
  type: OrganizationType;
  statut?: OrganizationStatut; // ACTIVE par défaut, SUSPENDED si suspendu

  // Informations légales
  raisonSociale: string;
  formeJuridique: string;
  rccm: string;
  ifu: string;
  secteurActivite: string;

  // Localisation
  pays: string;
  ville: string;
  boitePostale?: string;

  // Contact société
  email: string;
  telephone: string;

  // Représentant légal
  nomRepresentant: string;
  prenomRepresentant: string;
  fonctionRepresentant: string;
  emailRepresentant: string;
  telephoneRepresentant: string;

  // Optionnel
  logo?: string;

  createdAt: Date;
  updatedAt: Date;
}
