import "dotenv/config";
import { createServer } from "http";
import { IncomingMessage } from "http";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { connectDatabase } from "./config/database";
import { TrackingRepository } from "./tracking/tracking.repository";
import { TrackingService } from "./tracking/tracking.service";
import { createTrackingRouter } from "./tracking/tracking.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";
import { jwtVerifyMiddleware } from "./middlewares/jwtVerify.middleware";
import { requestIdMiddleware } from "./utils/requestId.middleware";
import { internalRateLimiter } from "./utils/rateLimit.middleware";
import { registerGracefulShutdown } from "./utils/gracefulShutdown";
import { logger } from "./utils/logger";

process.env["SERVICE_NAME"] = "tracking-service";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(requestIdMiddleware);
app.use(internalRateLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "tracking-service" });
});

app.use(jwtVerifyMiddleware);

const trackingRepository = new TrackingRepository();
const trackingService    = new TrackingService(trackingRepository);

app.use("/tracking", createTrackingRouter(trackingService));
app.use(errorMiddleware);

const HTTP_PORT = process.env["PORT"] ?? 3004;
const WS_PORT   = Number(process.env["WS_PORT"] ?? 3007);

const httpServer = createServer(app);

// WebSocket avec authentification JWT lors du handshake
const wss = new WebSocketServer({ port: WS_PORT });

function verifyWsToken(req: IncomingMessage): boolean {
  try {
    const url      = new URL(req.url ?? "", `http://localhost:${WS_PORT}`);
    const token    = url.searchParams.get("token");
    const authHeader = req.headers["authorization"];
    const rawToken = token ?? authHeader?.replace("Bearer ", "");
    if (!rawToken) return false;

    const secret = process.env["JWT_SECRET"];
    if (!secret) return false;

    jwt.verify(rawToken, secret);
    return true;
  } catch {
    return false;
  }
}

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  if (!verifyWsToken(req)) {
    logger.warn("WebSocket — connexion rejetée (token invalide)");
    ws.close(1008, "Token invalide ou manquant");
    return;
  }
  logger.info("WebSocket — client authentifié connecté");
  ws.on("close", () => logger.info("WebSocket — client déconnecté"));
});

trackingService.setWebSocketServer(wss);

connectDatabase()
  .then(() => {
    httpServer.listen(HTTP_PORT, () => {
      logger.info(`Tracking Service HTTP démarré sur le port ${HTTP_PORT}`);
      logger.info(`Tracking Service WebSocket démarré sur le port ${WS_PORT}`);
    });
    registerGracefulShutdown(httpServer, "tracking-service");
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Erreur de connexion MongoDB");
    process.exit(1);
  });

export default app;
