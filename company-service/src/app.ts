import './tracing';
import "dotenv/config";
import { createServer } from "http";
import express from "express";
import mongoose from "mongoose";
import { createOrganizationRouter } from "./organization/organization.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";
import { jwtVerifyMiddleware } from "./middlewares/jwtVerify.middleware";
import { requestIdMiddleware } from "./utils/requestId.middleware";
import { internalRateLimiter } from "./utils/rateLimit.middleware";
import { registerGracefulShutdown } from "./utils/gracefulShutdown";
import { logger } from "./utils/logger";
import { metricsMiddleware, metricsHandler } from "./utils/metrics.middleware";

process.env["SERVICE_NAME"] = "company-service";

const MONGO_URI = process.env["MONGO_URI"] ?? "mongodb://localhost:27017/company-service";

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
    status, service: "company-service", db, uptime: Math.floor(process.uptime()),
  });
});

app.get("/metrics", metricsHandler);

app.use(jwtVerifyMiddleware);

app.use("/company",     createOrganizationRouter("COMPANY"));
app.use("/transporter", createOrganizationRouter("TRANSPORTER"));
app.use(errorMiddleware);

const PORT   = process.env["PORT"] ?? 3001;
const server = createServer(app);

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
    minPoolSize: 2,
  })
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Company Service démarré sur le port ${PORT}`);
    });
    registerGracefulShutdown(server, "company-service");
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Erreur de connexion MongoDB");
    process.exit(1);
  });
