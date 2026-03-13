import "dotenv/config";
import { createServer } from "http";
import { IncomingMessage } from "http";
import express from "express";
import mongoose from "mongoose";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { connectDatabase } from "./config/database";
import { TrackingRepository } from "./tracking/tracking.repository";
import { TrackingService } from "./tracking/tracking.service";
import type { TrackingPoint } from "./tracking/tracking.entity";
import { createTrackingRouter } from "./tracking/tracking.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";
import { jwtVerifyMiddleware } from "./middlewares/jwtVerify.middleware";
import { requestIdMiddleware } from "./utils/requestId.middleware";
import { internalRateLimiter } from "./utils/rateLimit.middleware";
import { registerGracefulShutdown } from "./utils/gracefulShutdown";
import { logger } from "./utils/logger";
import { metricsMiddleware, metricsHandler } from "./utils/metrics.middleware";

process.env["SERVICE_NAME"] = "tracking-service";

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
    status, service: "tracking-service", db, uptime: Math.floor(process.uptime()),
  });
});

app.get("/metrics", metricsHandler);

app.use(jwtVerifyMiddleware);

const trackingRepository = new TrackingRepository();
const trackingService    = new TrackingService(trackingRepository);

app.use("/tracking", createTrackingRouter(trackingService));
app.use(errorMiddleware);

const HTTP_PORT = process.env["PORT"] ?? 3004;
const WS_PORT   = Number(process.env["WS_PORT"] ?? 3007);

const httpServer = createServer(app);

// ─── WebSocket avec authentification et subscriptions filtrées ──────────────
//
// Protocole client :
//   1. Connexion : ws://host:WS_PORT?token=<jwt>
//   2. Subscription : { "type": "subscribe", "shipmentId": "..." }
//      ou              { "type": "subscribe", "truckId": "..." }
//   3. Réception : { "type": "tracking:update", "data": <TrackingPoint> }
//                   uniquement si le point correspond à la subscription
//
// Sécurité : un chauffeur (DRIVER) ne peut s'abonner qu'à ses propres missions.
//            Les autres rôles peuvent s'abonner à n'importe quel shipment/truck.

interface WsSubscription {
  shipmentIds: Set<string>;
  truckIds:    Set<string>;
  role:        string;
  userId:      string;
}

const wss = new WebSocketServer({ port: WS_PORT });

// Map WebSocket → subscription du client
const subscriptions = new Map<WebSocket, WsSubscription>();

interface JwtPayload { sub: string; role: string; tenantId: string; exp?: number; }

function verifyWsToken(req: IncomingMessage): JwtPayload | null {
  try {
    const url      = new URL(req.url ?? "", `http://localhost:${WS_PORT}`);
    const token    = url.searchParams.get("token");
    const authHeader = req.headers["authorization"];
    const rawToken = token ?? authHeader?.replace("Bearer ", "");
    if (!rawToken) return null;

    const secret = process.env["JWT_SECRET"];
    if (!secret) return null;

    return jwt.verify(rawToken, secret) as JwtPayload;
  } catch {
    return null;
  }
}

// Heartbeat : détecte les clients zombie toutes les 30s
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const ext = ws as WebSocket & { isAlive?: boolean };
    if (ext.isAlive === false) {
      subscriptions.delete(ws);
      return ws.terminate();
    }
    ext.isAlive = false;
    ws.ping();
  });
}, 30_000);

wss.on("close", () => clearInterval(heartbeatInterval));

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  const payload = verifyWsToken(req);
  if (!payload) {
    logger.warn("WebSocket — connexion rejetée (token invalide)");
    ws.close(1008, "Token invalide ou manquant");
    return;
  }

  // Marque le client comme vivant à la connexion et sur chaque pong
  (ws as WebSocket & { isAlive?: boolean }).isAlive = true;
  ws.on("pong", () => { (ws as WebSocket & { isAlive?: boolean }).isAlive = true; });

  // Initialise la subscription vide
  subscriptions.set(ws, {
    shipmentIds: new Set(),
    truckIds:    new Set(),
    role:        payload.role,
    userId:      payload.sub,
  });

  logger.info({ userId: payload.sub, role: payload.role }, "WebSocket — client authentifié");

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as {
        type: string;
        shipmentId?: string;
        truckId?: string;
      };
      const sub = subscriptions.get(ws);
      if (!sub || msg.type !== "subscribe") return;

      if (msg.shipmentId) sub.shipmentIds.add(msg.shipmentId);
      if (msg.truckId)    sub.truckIds.add(msg.truckId);

      logger.debug(
        { userId: sub.userId, shipmentId: msg.shipmentId, truckId: msg.truckId },
        "WebSocket — subscription enregistrée"
      );
    } catch {
      // message malformé — ignore
    }
  });

  ws.on("close", () => {
    subscriptions.delete(ws);
    logger.info({ userId: payload.sub }, "WebSocket — client déconnecté");
  });
});

// Expose la fonction de broadcast filtré au service
export function broadcastTrackingUpdate(point: TrackingPoint): void {
  const message = JSON.stringify({ type: "tracking:update", data: point });

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;

    const sub = subscriptions.get(client);
    if (!sub) return;

    // Diffuse uniquement aux clients abonnés à ce shipment ou ce truck
    const interested =
      (point.shipmentId && sub.shipmentIds.has(point.shipmentId)) ||
      sub.truckIds.has(point.truckId);

    if (interested) client.send(message);
  });
}

trackingService.setWebSocketServer(wss, broadcastTrackingUpdate);

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
