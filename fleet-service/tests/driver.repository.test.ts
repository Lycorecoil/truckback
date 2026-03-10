import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { DriverRepository } from "../src/driver/driver.repository";

let mongoServer: MongoMemoryServer;
const repo = new DriverRepository();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await mongoose.connection.dropDatabase();
});

const baseDriver = {
  tenantId: "tenant-1",
  nom: "Dupont",
  prenom: "Jean",
  email: "jean.dupont@example.com",
  telephone: "0601020304",
  numeroPermis: "PERM123",
  statut: "AVAILABLE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("DriverRepository", () => {
  it("create puis findById retourne le chauffeur", async () => {
    const created = await repo.create(baseDriver);
    expect(created.id).toBeDefined();
    const found = await repo.findById(created.id);
    expect(found?.email).toBe("jean.dupont@example.com");
  });

  it("update modifie le statut", async () => {
    const created = await repo.create(baseDriver);
    const updated = await repo.update(created.id, { statut: "SUSPENDED" });
    expect(updated.statut).toBe("SUSPENDED");
  });

  it("findByTenantId retourne les chauffeurs du transporteur", async () => {
    await repo.create(baseDriver);
    await repo.create({
      ...baseDriver,
      email: "autre@example.com",
      numeroPermis: "PERM456",
    });
    const drivers = await repo.findByTenantId("tenant-1");
    expect(drivers).toHaveLength(2);
  });

  it("exists retourne true si le chauffeur existe", async () => {
    const created = await repo.create(baseDriver);
    expect(await repo.exists(created.id)).toBe(true);
    expect(await repo.exists("fake-id")).toBe(false);
  });
});
