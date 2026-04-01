import { TruckService } from "../src/truck/truck.service";
import type { TruckRepository } from "../src/truck/truck.repository";
import type { Truck } from "../src/truck/truck.entity";

const mockTruck: Truck = {
  id: "uuid-1",
  tenantId: "tenant-1",
  immatriculation: "AB-123-CD",
  chassis: "CHS001",
  marque: "Mercedes",
  modele: "Actros",
  typeVehicule: "BENNE",
  capaciteMax: 20000,
  statut: "AVAILABLE",
  villeBase: "Cotonou",
  paysBase: "Benin",
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
  findByTenantId: jest.fn(),
  findAvailable: jest.fn(),
  findMatching: jest.fn(),
  findByDriverId: jest.fn(),
} as unknown as TruckRepository;

const service = new TruckService(mockRepo);

beforeEach(() => jest.clearAllMocks());

describe("TruckService", () => {
  it("getById retourne un ServiceResponse avec le camion", async () => {
    (mockRepo.findById as jest.Mock).mockResolvedValue(mockTruck);
    const result = await service.getById("uuid-1");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTruck);
    expect(mockRepo.findById).toHaveBeenCalledWith("uuid-1");
  });

  it("createOne cree un camion et retourne ServiceResponse", async () => {
    const { id, ...data } = mockTruck;
    (mockRepo.create as jest.Mock).mockResolvedValue(mockTruck);
    const result = await service.createOne(data);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTruck);
  });

  it("findByTenantId retourne les camions du transporteur", async () => {
    (mockRepo.findByTenantId as jest.Mock).mockResolvedValue([mockTruck]);
    const result = await service.findByTenantId("tenant-1");
    expect(result).toHaveLength(1);
    expect(mockRepo.findByTenantId).toHaveBeenCalledWith("tenant-1");
  });

  it("findAvailable retourne les camions disponibles", async () => {
    (mockRepo.findAvailable as jest.Mock).mockResolvedValue([mockTruck]);
    const result = await service.findAvailable("tenant-1");
    expect(result).toHaveLength(1);
    expect(mockRepo.findAvailable).toHaveBeenCalledWith("tenant-1");
  });

  it("findMatching retourne les camions compatibles", async () => {
    (mockRepo.findMatching as jest.Mock).mockResolvedValue([mockTruck]);
    const result = await service.findMatching({ poids: 5000, villeDepart: "Cotonou", paysDepart: "Benin" });
    expect(result).toHaveLength(1);
    expect(result[0]?.villeBase).toBe("Cotonou");
  });

  it("assignDriver met a jour le driverId du camion", async () => {
    const updated = { ...mockTruck, driverId: "driver-1" };
    (mockRepo.findByDriverId as jest.Mock).mockResolvedValue(null); // driver pas encore assigné
    (mockRepo.findById as jest.Mock).mockResolvedValue(mockTruck);  // camion sans driver
    (mockRepo.update as jest.Mock).mockResolvedValue(updated);
    const result = await service.assignDriver("uuid-1", "driver-1");
    expect(result.driverId).toBe("driver-1");
    expect(mockRepo.update).toHaveBeenCalledWith("uuid-1", { driverId: "driver-1" });
  });

  it("assignDriver leve 409 si le chauffeur est deja assigne a un autre camion", async () => {
    (mockRepo.findByDriverId as jest.Mock).mockResolvedValue({ ...mockTruck, id: "autre-camion" });
    await expect(service.assignDriver("uuid-1", "driver-1")).rejects.toMatchObject({ statusCode: 409 });
  });

  it("unassignDriver retire le driverId du camion", async () => {
    const updated = { ...mockTruck, driverId: undefined };
    (mockRepo.findById as jest.Mock).mockResolvedValue(mockTruck); // statut AVAILABLE → ok
    (mockRepo.update as jest.Mock).mockResolvedValue(updated);
    const result = await service.unassignDriver("uuid-1");
    expect(result.driverId).toBeUndefined();
  });

  it("unassignDriver leve 409 si le camion est en mission", async () => {
    (mockRepo.findById as jest.Mock).mockResolvedValue({ ...mockTruck, statut: "BUSY" as const });
    await expect(service.unassignDriver("uuid-1")).rejects.toMatchObject({ statusCode: 409 });
  });

  it("updateOne (soft delete) passe le statut MAINTENANCE", async () => {
    const maintained = { ...mockTruck, statut: "MAINTENANCE" as const };
    (mockRepo.exists as jest.Mock).mockResolvedValue(true);
    (mockRepo.update as jest.Mock).mockResolvedValue(maintained);
    const result = await service.updateOne("uuid-1", { statut: "MAINTENANCE" });
    expect(result.success).toBe(true);
    expect(result.data.statut).toBe("MAINTENANCE");
  });
});
