import "dotenv/config";
import express from "express";
import { connectDatabase } from "./config/database";
import { TruckRepository } from "./truck/truck.repository";
import { TruckService } from "./truck/truck.service";
import { createTruckRouter } from "./truck/truck.controller";
import { DriverRepository } from "./driver/driver.repository";
import { DriverService } from "./driver/driver.service";
import { createDriverRouter } from "./driver/driver.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";

const app = express();
app.use(express.json());

// Instanciation des dépendances
const truckRepository = new TruckRepository();
const truckService = new TruckService(truckRepository);

const driverRepository = new DriverRepository();
const driverService = new DriverService(driverRepository);

// Routes
app.use("/fleet/trucks", createTruckRouter(truckService));
app.use("/fleet/drivers", createDriverRouter(driverService));

// Middleware d'erreurs — toujours en dernier
app.use(errorMiddleware);

const PORT = process.env["PORT"] ?? 3003;

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Fleet Service démarré sur le port ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Erreur de connexion MongoDB :", err);
    process.exit(1);
  });

export default app;
