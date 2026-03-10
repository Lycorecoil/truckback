import "dotenv/config";
import express from "express";
import { createOrganizationRouter } from "./organization/organization.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";
import { connectDatabase } from "./config/database";

const app = express();

// Parse le body JSON des requêtes entrantes
app.use(express.json());

// Routes — même logique, deux chemins distincts filtrés par type
app.use("/company", createOrganizationRouter("COMPANY"));
app.use("/transporter", createOrganizationRouter("TRANSPORTER"));

// Middleware d'erreurs — toujours en dernier
app.use(errorMiddleware);

// Démarrage du serveur
const PORT = process.env.PORT || 3001;

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Company Service démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Échec de connexion à MongoDB :", err);
    process.exit(1);
  });

export { app };
