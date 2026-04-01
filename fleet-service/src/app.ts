import './tracing';
import "dotenv/config";
import { createServer } from "http";
import express from "express";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { TruckRepository } from "./truck/truck.repository";
import { TruckService } from "./truck/truck.service";
import { createTruckRouter } from "./truck/truck.controller";
import { DriverRepository } from "./driver/driver.repository";
import { DriverService } from "./driver/driver.service";
import { createDriverRouter } from "./driver/driver.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";
import { jwtVerifyMiddleware } from "./middlewares/jwtVerify.middleware";
import { requestIdMiddleware } from "./utils/requestId.middleware";
import { internalRateLimiter } from "./utils/rateLimit.middleware";
import { registerGracefulShutdown } from "./utils/gracefulShutdown";
import { logger } from "./utils/logger";
import { metricsMiddleware, metricsHandler } from "./utils/metrics.middleware";

process.env["SERVICE_NAME"] = "fleet-service";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(requestIdMiddleware);
app.use(internalRateLimiter);
app.use(metricsMiddleware);

app.get("/health", (_req, res) => {
  const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const status = db === "connected" ? "ok" : "degraded";
  res.status(db === "connected" ? 200 : 503).json({
    status, service: "fleet-service", db, uptime: Math.floor(process.uptime()),
  });
});

app.get("/metrics", metricsHandler);

app.use(jwtVerifyMiddleware);

const truckService  = new TruckService(new TruckRepository());
const driverService = new DriverService(new DriverRepository());

app.use("/trucks",  createTruckRouter(truckService));
app.use("/drivers", createDriverRouter(driverService));
app.use(errorMiddleware);

const PORT = process.env["PORT"] ?? 3003;
const server = createServer(app);

connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Fleet Service démarré sur le port ${PORT}`);
    });
    registerGracefulShutdown(server, "fleet-service");
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Erreur de connexion MongoDB");
    process.exit(1);
  });

export default app;
