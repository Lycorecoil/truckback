import { ShipmentService } from "../src/shipment/shipment.service";
import type { ShipmentRepository } from "../src/shipment/shipment.repository";
import type { Shipment } from "../src/shipment/shipment.entity";

const mockShipment: Shipment = {
  id: "shipment-uuid-1",
  companyId: "company-uuid-1",
  dateAnnonce: new Date("2025-06-15"),
  heureAnnonce: "08:00",
  marchandise: "Ciment",
  quantite: 200,
  poids: 10000,
  paysDepart: "Benin",
  villeDepart: "Cotonou",
  paysArrivee: "Benin",
  villeArrivee: "Porto-Novo",
  statut: "PENDING",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findByCompanyId: jest.fn(),
  findByTransporterId: jest.fn(),
  findByStatut: jest.fn(),
  acceptIfPending: jest.fn(),
} as unknown as ShipmentRepository;

const service = new ShipmentService(mockRepo);

beforeEach(() => jest.clearAllMocks());

describe("ShipmentService", () => {
  it("findByCompanyId retourne les expeditions de l'expediteur", async () => {
    (mockRepo.findByCompanyId as jest.Mock).mockResolvedValue([mockShipment]);
    const result = await service.findByCompanyId("company-uuid-1");
    expect(result).toHaveLength(1);
    expect(result[0]?.companyId).toBe("company-uuid-1");
  });

  it("acceptShipment assigne un camion et passe a ACCEPTED", async () => {
    (mockRepo.acceptIfPending as jest.Mock).mockResolvedValue({
      ...mockShipment,
      transporterId: "transporteur-1",
      truckId: "truck-1",
      driverId: "driver-1",
      statut: "ACCEPTED",
    });
    const result = await service.acceptShipment("shipment-uuid-1", {
      transporterId: "transporteur-1",
      truckId: "truck-1",
      driverId: "driver-1",
    });
    expect(result.statut).toBe("ACCEPTED");
    expect(result.transporterId).toBe("transporteur-1");
  });

  it("acceptShipment rejette si l'annonce n'est plus PENDING", async () => {
    (mockRepo.acceptIfPending as jest.Mock).mockResolvedValue(null);
    await expect(
      service.acceptShipment("shipment-uuid-1", {
        transporterId: "transporteur-1",
        truckId: "truck-1",
        driverId: "driver-1",
      })
    ).rejects.toThrow("Cette annonce n'est plus disponible");
  });

  it("startMission passe le statut a IN_PROGRESS", async () => {
    (mockRepo.update as jest.Mock).mockResolvedValue({ ...mockShipment, statut: "IN_PROGRESS" });
    const result = await service.startMission("shipment-uuid-1");
    expect(result.statut).toBe("IN_PROGRESS");
  });

  it("deliverMission passe le statut a DELIVERED", async () => {
    (mockRepo.update as jest.Mock).mockResolvedValue({ ...mockShipment, statut: "DELIVERED" });
    const result = await service.deliverMission("shipment-uuid-1");
    expect(result.statut).toBe("DELIVERED");
  });
});
