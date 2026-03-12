import mongoose from "mongoose";

const MONGOOSE_OPTS: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

/**
 * Connexion à MongoDB via Mongoose.
 * L'URI est lue depuis la variable d'environnement MONGO_URI.
 */
export const connectDatabase = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("La variable d'environnement MONGO_URI est manquante.");
  }

  await mongoose.connect(uri, MONGOOSE_OPTS);
  console.log("✅ Connecté à MongoDB");
};
