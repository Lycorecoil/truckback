import { GenericService } from "@jb226/generic-service";
import type { TrackingPoint } from "./tracking.entity";
import type { TrackingRepository } from "./tracking.repository";
import type { WebSocketServer } from "ws";

export class TrackingService extends GenericService<TrackingPoint> {
  private wss: WebSocketServer | null = null;

  constructor(private readonly trackingRepo: TrackingRepository) {
    super(trackingRepo);
  }

  setWebSocketServer(wss: WebSocketServer): void {
    this.wss = wss;
  }

  async addPoint(data: Omit<TrackingPoint, "id" | "createdAt" | "updatedAt">): Promise<TrackingPoint> {
    const point = await this.trackingRepo.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Diffusion WebSocket à tous les clients connectés
    if (this.wss) {
      const message = JSON.stringify({ type: "tracking:update", data: point });
      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    }

    return point;
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
