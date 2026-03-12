import mongoose, { Schema } from "mongoose";

/**
 * Stocke les refresh tokens révoqués (logout ou rotation).
 * Le TTL index supprime automatiquement les documents expirés —
 * la collection ne grossit donc pas indéfiniment.
 */
const RevokedTokenSchema = new Schema(
  {
    token:     { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date,   required: true },
  },
  { _id: true, versionKey: false },
);

// MongoDB supprime automatiquement le document quand expiresAt est dépassé
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedTokenModel = mongoose.model("RevokedToken", RevokedTokenSchema);
