import "dotenv/config";
import { createServer } from "http";
import express from "express";
import { connectDatabase } from "./config/database";
import { ShipmentRepository } from "./shipment/shipment.repository";
import { ShipmentService } from "./shipment/shipment.service";
import { createShipmentRouter } from "./shipment/shipment.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";
import { jwtVerifyMiddleware } from "./middlewares/jwtVerify.middleware";
import { requestIdMiddleware } from "./utils/requestId.middleware";
import { internalRateLimiter } from "./utils/rateLimit.middleware";
import { registerGracefulShutdown } from "./utils/gracefulShutdown";
import { logger } from "./utils/logger";

process.env["SERVICE_NAME"] = "shipment-service";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(requestIdMiddleware);
app.use(internalRateLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "shipment-service" });
});

app.use(jwtVerifyMiddleware);

const shipmentService = new ShipmentService(new ShipmentRepository());
app.use("/shipments", createShipmentRouter(shipmentService));
app.use(errorMiddleware);

const PORT = process.env["PORT"] ?? 3002;
const server = createServer(app);

connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Shipment Service démarré sur le port ${PORT}`);
    });
    registerGracefulShutdown(server, "shipment-service");
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Erreur de connexion MongoDB");
    process.exit(1);
  });

export default app;
