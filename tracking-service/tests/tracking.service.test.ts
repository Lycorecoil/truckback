import { TrackingService } from "../src/tracking/tracking.service";
import type { TrackingRepository } from "../src/tracking/tracking.repository";
import type { TrackingPoint } from "../src/tracking/tracking.entity";

const mockPoint: TrackingPoint = {
  id: "uuid-1",
  truckId: "truck-1",
  shipmentId: "shipment-1",
  latitude: 6.3654,
  longitude: 2.4183,
  vitesse: 60,
  timestamp: new Date("2025-06-15T08:00:00Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock global fetch — évite les vraies requêtes HTTP vers notification-service
beforeAll(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({}),
  }) as jest.Mock;
});

afterAll(() => {
  jest.restoreAllMocks();
});

const mockRepo = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findByShipmentId: jest.fn(),
  findLatestByTruckId: jest.fn(),
  findLatestByShipmentId: jest.fn(),
  findHistoryByTruckId: jest.fn(),
} as unknown as TrackingRepository;

const service = new TrackingService(mockRepo);

beforeEach(() => jest.clearAllMocks());

describe("TrackingService", () => {
  it("addPoint crée un point et le retourne", async () => {
    (mockRepo.create as jest.Mock).mockResolvedValue(mockPoint);
    const result = await service.addPoint({
      truckId: "truck-1",
      shipmentId: "shipment-1",
      latitude: 6.3654,
      longitude: 2.4183,
      vitesse: 60,
      timestamp: new Date(),
    });
    expect(result.id).toBe("uuid-1");
    expect(result.truckId).toBe("truck-1");
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });

  it("addPoint sans vitesse est valide", async () => {
    (mockRepo.create as jest.Mock).mockResolvedValue({ ...mockPoint, vitesse: undefined });
    const result = await service.addPoint({
      truckId: "truck-1",
      shipmentId: "shipment-1",
      latitude: 6.3654,
      longitude: 2.4183,
      timestamp: new Date(),
    });
    expect(result.vitesse).toBeUndefined();
  });

  it("getLatestByTruck retourne le dernier point du camion", async () => {
    (mockRepo.findLatestByTruckId as jest.Mock).mockResolvedValue(mockPoint);
    const result = await service.getLatestByTruck("truck-1");
    expect(result?.latitude).toBe(6.3654);
    expect(mockRepo.findLatestByTruckId).toHaveBeenCalledWith("truck-1");
  });

  it("getLatestByTruck retourne null si aucun point", async () => {
    (mockRepo.findLatestByTruckId as jest.Mock).mockResolvedValue(null);
    const result = await service.getLatestByTruck("truck-inconnu");
    expect(result).toBeNull();
  });

  it("getHistoryByTruck retourne l'historique complet", async () => {
    const point2 = { ...mockPoint, id: "uuid-2", latitude: 6.5 };
    (mockRepo.findHistoryByTruckId as jest.Mock).mockResolvedValue([mockPoint, point2]);
    const result = await service.getHistoryByTruck("truck-1");
    expect(result).toHaveLength(2);
    expect(mockRepo.findHistoryByTruckId).toHaveBeenCalledWith("truck-1");
  });

  it("getByShipment retourne tous les points de l'expédition", async () => {
    (mockRepo.findByShipmentId as jest.Mock).mockResolvedValue([mockPoint]);
    const result = await service.getByShipment("shipment-1");
    expect(result).toHaveLength(1);
    expect(result[0]?.shipmentId).toBe("shipment-1");
    expect(mockRepo.findByShipmentId).toHaveBeenCalledWith("shipment-1");
  });
});
