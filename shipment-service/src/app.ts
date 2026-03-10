import "dotenv/config";
import express from "express";
import { connectDatabase } from "./config/database";
import { ShipmentRepository } from "./shipment/shipment.repository";
import { ShipmentService } from "./shipment/shipment.service";
import { createShipmentRouter } from "./shipment/shipment.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";

const app = express();
app.use(express.json());

const shipmentRepository = new ShipmentRepository();
const shipmentService = new ShipmentService(shipmentRepository);

app.use("/shipments", createShipmentRouter(shipmentService));

app.use(errorMiddleware);

const PORT = process.env["PORT"] ?? 3004;

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Shipment Service démarré sur le port ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Erreur de connexion MongoDB :", err);
    process.exit(1);
  });

export default app;
