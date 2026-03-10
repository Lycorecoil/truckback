import mongoose from "mongoose";

/**
 * Connexion à MongoDB via Mongoose.
 * L'URI est lue depuis la variable d'environnement MONGO_URI.
 */
export const connectDatabase = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("La variable d'environnement MONGO_URI est manquante.");
  }

  await mongoose.connect(uri);
  console.log("✅ Connecté à MongoDB");
};
