import { DriverService } from "../src/driver/driver.service";
import type { DriverRepository } from "../src/driver/driver.repository";
import type { Driver } from "../src/driver/driver.entity";

const mockDriver: Driver = {
  id: "uuid-d1",
  tenantId: "tenant-1",
  nom: "Dupont",
  prenom: "Jean",
  email: "jean.dupont@example.com",
  telephone: "0601020304",
  numeroPermis: "PERM123",
  statut: "AVAILABLE",
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
} as unknown as DriverRepository;

const service = new DriverService(mockRepo);

beforeEach(() => jest.clearAllMocks());

describe("DriverService", () => {
  it("getById retourne un ServiceResponse avec le chauffeur", async () => {
    (mockRepo.findById as jest.Mock).mockResolvedValue(mockDriver);
    const result = await service.getById("uuid-d1");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockDriver);
  });

  it("createOne crée un chauffeur et retourne ServiceResponse", async () => {
    const { id, ...data } = mockDriver;
    (mockRepo.create as jest.Mock).mockResolvedValue(mockDriver);
    const result = await service.createOne(data);
    expect(result.success).toBe(true);
    expect(result.data.email).toBe("jean.dupont@example.com");
  });

  it("findByTenantId retourne les chauffeurs du transporteur", async () => {
    (mockRepo.findByTenantId as jest.Mock).mockResolvedValue([mockDriver]);
    const result = await service.findByTenantId("tenant-1");
    expect(result).toHaveLength(1);
  });

  it("updateOne (soft delete) passe le statut SUSPENDED", async () => {
    const suspended = { ...mockDriver, statut: "SUSPENDED" as const };
    (mockRepo.exists as jest.Mock).mockResolvedValue(true);
    (mockRepo.update as jest.Mock).mockResolvedValue(suspended);
    const result = await service.updateOne("uuid-d1", { statut: "SUSPENDED" });
    expect(result.success).toBe(true);
    expect(result.data.statut).toBe("SUSPENDED");
  });
});
