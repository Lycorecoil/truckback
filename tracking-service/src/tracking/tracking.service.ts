import { GenericService } from "@jb226/generic-service";
import type { TrackingPoint } from "./tracking.entity";
import type { TrackingRepository } from "./tracking.repository";
import type { WebSocketServer } from "ws";
import { sendEmail } from "../clients/NotificationClient";

const GPS_SILENCE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

type BroadcastFn = (point: TrackingPoint) => void;

export class TrackingService extends GenericService<TrackingPoint> {
  private wss: WebSocketServer | null = null;
  private broadcastFn: BroadcastFn | null = null;

  constructor(private readonly trackingRepo: TrackingRepository) {
    super(trackingRepo);
  }

  /**
   * Injecte le serveur WebSocket et la fonction de broadcast filtrée.
   * Appelé depuis app.ts après création du WSS.
   */
  setWebSocketServer(wss: WebSocketServer, broadcastFn?: BroadcastFn): void {
    this.wss = wss;
    this.broadcastFn = broadcastFn ?? null;
  }

  async addPoint(data: Omit<TrackingPoint, "id" | "createdAt" | "updatedAt">): Promise<TrackingPoint> {
    // Vérifier si le GPS était silencieux avant ce nouveau point
    void this.checkGpsSilence(data.shipmentId, data.truckId);

    const point = await this.trackingRepo.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Broadcast filtré : uniquement aux clients abonnés à ce shipment/truck
    if (this.broadcastFn) {
      this.broadcastFn(point);
    } else if (this.wss) {
      // Fallback : broadcast global si pas de fonction filtrée (tests, etc.)
      const message = JSON.stringify({ type: "tracking:update", data: point });
      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(message);
      });
    }

    return point;
  }

  private async checkGpsSilence(shipmentId: string, truckId: string): Promise<void> {
    try {
      const last = await this.trackingRepo.findLatestByShipmentId(shipmentId);
      if (!last) return; // premier point, pas d'alerte

      const gapMs = Date.now() - new Date(last.timestamp).getTime();
      if (gapMs >= GPS_SILENCE_THRESHOLD_MS) {
        const gapMin = Math.round(gapMs / 60000);
        void sendEmail(
          shipmentId,
          `expediteur-${shipmentId}@camion-uber.internal`,
          "Alerte : GPS du camion silencieux",
          `Le camion ${truckId} n'a pas envoyé de position GPS depuis ${gapMin} minutes. Un reprise de signal vient d'être détectée.`,
        );
      }
    } catch (err) {
      console.error("[tracking-service] Erreur vérification silence GPS :", err);
    }
  }

  async getLatestByTruck(truckId: string): Promise<TrackingPoint | null> {
    return this.trackingRepo.findLatestByTruckId(truckId);
  }

  async getHistoryByTruck(truckId: string): Promise<TrackingPoint[]> {
    return this.trackingRepo.findHistoryByTruckId(truckId);
  }

  async getByShipment(shipmentId: string): Promise<TrackingPoint[]> {
    return this.trackingRepo.findByShipmentId(shipmentId);
  }
}
