import { Schema, model } from "mongoose";
import { Organization } from "./organization.entity";

/**
 * Schéma Mongoose pour Organization.
 * On utilise des UUIDs (string) comme identifiant plutôt que les ObjectId MongoDB,
 * pour rester cohérent avec BaseEntity et les autres services.
 */
const OrganizationSchema = new Schema<Organization>(
  {
    // Identifiant UUID géré manuellement (pas l'_id MongoDB)
    id: { type: String, required: true, unique: true },

    // Lien vers le User dans le Auth Service (même tenantId)
    tenantId: { type: String, required: true, unique: true },

    // Type d'organisation : expéditeur ou transporteur
    type: { type: String, enum: ["EXPEDITEUR", "TRANSPORTER"], required: true },

    // Statut du compte : actif ou suspendu (ACTIVE par défaut)
    statut: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" },

    // Informations légales
    raisonSociale: { type: String, required: true },
    formeJuridique: { type: String, required: true },
    rccm: { type: String, required: true },
    ifu: { type: String, required: true },
    secteurActivite: { type: String, required: true },

    // Localisation
    pays: { type: String, required: true },
    ville: { type: String, required: true },
    boitePostale: { type: String },

    // Contact société
    email: { type: String, required: true },
    telephone: { type: String, required: true },

    // Représentant légal
    nomRepresentant: { type: String, required: true },
    prenomRepresentant: { type: String, required: true },
    fonctionRepresentant: { type: String, required: true },
    emailRepresentant: { type: String, required: true },
    telephoneRepresentant: { type: String, required: true },

    // Optionnel
    logo: { type: String },
  },
  {
    // Mongoose gère createdAt et updatedAt automatiquement
    timestamps: true,
    // On utilise id (string UUID) et non _id (ObjectId) dans les réponses
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret["_id"];
        delete ret["__v"];
        return ret;
      },
    },
  }
);

export const OrganizationModel = model<Organization>(
  "Organization",
  OrganizationSchema
);
