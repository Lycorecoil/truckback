import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { connectDatabase } from "./config/database";
import { TrackingRepository } from "./tracking/tracking.repository";
import { TrackingService } from "./tracking/tracking.service";
import { createTrackingRouter } from "./tracking/tracking.controller";
import { errorMiddleware } from "./middlewares/error.middlewares";

const app = express();
app.use(express.json());

// Instanciation des dépendances
const trackingRepository = new TrackingRepository();
const trackingService = new TrackingService(trackingRepository);

// Routes
app.use("/tracking", createTrackingRouter(trackingService));

// Middleware d'erreurs — toujours en dernier
app.use(errorMiddleware);

const HTTP_PORT = process.env["PORT"] ?? 3004;
const WS_PORT = Number(process.env["WS_PORT"] ?? 3005);

// Serveur HTTP
const httpServer = createServer(app);

// Serveur WebSocket sur son propre port
const wss = new WebSocketServer({ port: WS_PORT });
trackingService.setWebSocketServer(wss);

wss.on("connection", (ws) => {
  console.log("Client WebSocket connecté");
  ws.on("close", () => console.log("Client WebSocket déconnecté"));
});

connectDatabase()
  .then(() => {
    httpServer.listen(HTTP_PORT, () => {
      console.log(`Tracking Service HTTP démarré sur le port ${HTTP_PORT}`);
      console.log(`Tracking Service WebSocket démarré sur le port ${WS_PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Erreur de connexion MongoDB :", err);
    process.exit(1);
  });

export default app;
