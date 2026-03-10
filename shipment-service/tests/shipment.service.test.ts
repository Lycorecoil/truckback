import { ShipmentService } from "../src/shipment/shipment.service";
import type { ShipmentRepository } from "../src/shipment/shipment.repository";
import type { Shipment } from "../src/shipment/shipment.entity";

const mockShipment: Shipment = {
  id: "uuid-s1",
  companyId: "company-1",
  origine: "Paris",
  destination: "Lyon",
  description: "Palettes de céréales",
  poids: 5000,
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
} as unknown as ShipmentRepository;

const service = new ShipmentService(mockRepo);

beforeEach(() => jest.clearAllMocks());

describe("ShipmentService", () => {
  it("getById retourne un ServiceResponse avec la mission", async () => {
    (mockRepo.findById as jest.Mock).mockResolvedValue(mockShipment);
    const result = await service.getById("uuid-s1");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockShipment);
    expect(mockRepo.findById).toHaveBeenCalledWith("uuid-s1");
  });

  it("createOne crée une mission avec statut PENDING", async () => {
    const { id, ...data } = mockShipment;
    (mockRepo.create as jest.Mock).mockResolvedValue(mockShipment);
    const result = await service.createOne(data);
    expect(result.success).toBe(true);
    expect(result.data.statut).toBe("PENDING");
  });

  it("findByCompanyId retourne les missions de la company", async () => {
    (mockRepo.findByCompanyId as jest.Mock).mockResolvedValue([mockShipment]);
    const result = await service.findByCompanyId("company-1");
    expect(result).toHaveLength(1);
    expect(mockRepo.findByCompanyId).toHaveBeenCalledWith("company-1");
  });

  it("findByStatut retourne les missions PENDING", async () => {
    (mockRepo.findByStatut as jest.Mock).mockResolvedValue([mockShipment]);
    const result = await service.findByStatut("PENDING");
    expect(result).toHaveLength(1);
    expect(mockRepo.findByStatut).toHaveBeenCalledWith("PENDING");
  });

  it("acceptShipment assigne le transporteur et passe en ACCEPTED", async () => {
    const accepted = {
      ...mockShipment,
      transporterId: "transporter-1",
      truckId: "truck-1",
      driverId: "driver-1",
      statut: "ACCEPTED" as const,
    };
    (mockRepo.update as jest.Mock).mockResolvedValue(accepted);
    const result = await service.acceptShipment("uuid-s1", {
      transporterId: "transporter-1",
      truckId: "truck-1",
      driverId: "driver-1",
    });
    expect(result.statut).toBe("ACCEPTED");
    expect(result.transporterId).toBe("transporter-1");
    expect(mockRepo.update).toHaveBeenCalledWith("uuid-s1", {
      transporterId: "transporter-1",
      truckId: "truck-1",
      driverId: "driver-1",
      statut: "ACCEPTED",
    });
  });

  it("startMission passe en IN_PROGRESS", async () => {
    const inProgress = { ...mockShipment, statut: "IN_PROGRESS" as const };
    (mockRepo.update as jest.Mock).mockResolvedValue(inProgress);
    const result = await service.startMission("uuid-s1");
    expect(result.statut).toBe("IN_PROGRESS");
    expect(mockRepo.update).toHaveBeenCalledWith("uuid-s1", { statut: "IN_PROGRESS" });
  });

  it("deliverMission passe en DELIVERED", async () => {
    const delivered = { ...mockShipment, statut: "DELIVERED" as const };
    (mockRepo.update as jest.Mock).mockResolvedValue(delivered);
    const result = await service.deliverMission("uuid-s1");
    expect(result.statut).toBe("DELIVERED");
    expect(mockRepo.update).toHaveBeenCalledWith("uuid-s1", { statut: "DELIVERED" });
  });

  it("updateOne (soft delete) passe en CANCELLED", async () => {
    const cancelled = { ...mockShipment, statut: "CANCELLED" as const };
    (mockRepo.exists as jest.Mock).mockResolvedValue(true);
    (mockRepo.update as jest.Mock).mockResolvedValue(cancelled);
    const result = await service.updateOne("uuid-s1", { statut: "CANCELLED" });
    expect(result.success).toBe(true);
    expect(result.data.statut).toBe("CANCELLED");
  });
});
