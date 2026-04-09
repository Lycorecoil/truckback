import { Schema, model } from "mongoose";
import { CguVersion } from "./cgu.entity";

const CguVersionSchema = new Schema<CguVersion>(
  {
    id:       { type: String, required: true, unique: true },
    version:  { type: String, required: true, unique: true },
    titre:    { type: String, required: true },
    resume:   { type: String, required: true },
    contenu:  { type: String, required: true },
    statut:   { type: String, enum: ["BROUILLON", "ACTIVE", "ARCHIVEE"], default: "BROUILLON" },
    activatedAt: { type: Date,   default: null },
    activatedBy: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret["_id"];
        delete ret["__v"];
        return ret;
      },
    },
  }
);

export const CguVersionModel = model<CguVersion>("CguVersion", CguVersionSchema);
