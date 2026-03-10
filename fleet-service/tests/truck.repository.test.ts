import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { TruckRepository } from "../src/truck/truck.repository";

let mongoServer: MongoMemoryServer;
const repo = new TruckRepository();

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

const baseTruck = {
  tenantId: "tenant-1",
  immatriculation: "AB-123-CD",
  chassis: "CHS001",
  marque: "Mercedes",
  modele: "Actros",
  typeVehicule: "BENNE",
  capaciteMax: 20000,
  statut: "AVAILABLE" as const,
  villeBase: "Cotonou",
  paysBase: "Benin",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("TruckRepository", () => {
  it("create puis findById retourne le camion", async () => {
    const created = await repo.create(baseTruck);
    expect(created.id).toBeDefined();
    const found = await repo.findById(created.id);
    expect(found?.immatriculation).toBe("AB-123-CD");
  });

  it("update modifie le statut", async () => {
    const created = await repo.create(baseTruck);
    const updated = await repo.update(created.id, { statut: "BUSY" });
    expect(updated.statut).toBe("BUSY");
  });

  it("findByTenantId retourne les camions du transporteur", async () => {
    await repo.create(baseTruck);
    await repo.create({ ...baseTruck, immatriculation: "EF-456-GH", chassis: "CHS002" });
    const trucks = await repo.findByTenantId("tenant-1");
    expect(trucks).toHaveLength(2);
  });

  it("findAvailable ne retourne que les camions AVAILABLE", async () => {
    const t1 = await repo.create(baseTruck);
    await repo.create({ ...baseTruck, immatriculation: "EF-456-GH", chassis: "CHS002" });
    await repo.update(t1.id, { statut: "BUSY" });
    const available = await repo.findAvailable("tenant-1");
    expect(available).toHaveLength(1);
    expect(available[0]?.immatriculation).toBe("EF-456-GH");
  });

  it("findMatching retourne les camions compatibles par zone et poids", async () => {
    await repo.create(baseTruck);
    await repo.create({ ...baseTruck, immatriculation: "EF-456-GH", chassis: "CHS002", villeBase: "Porto-Novo" });
    const trucks = await repo.findMatching({ poids: 5000, villeDepart: "Cotonou", paysDepart: "Benin" });
    expect(trucks).toHaveLength(1);
    expect(trucks[0]?.villeBase).toBe("Cotonou");
  });

  it("findMatching filtre aussi par typeVehicule", async () => {
    await repo.create(baseTruck);
    await repo.create({ ...baseTruck, immatriculation: "EF-456-GH", chassis: "CHS002", typeVehicule: "PLATEAU" });
    const trucks = await repo.findMatching({ poids: 5000, villeDepart: "Cotonou", paysDepart: "Benin", typeVehicule: "BENNE" });
    expect(trucks).toHaveLength(1);
    expect(trucks[0]?.typeVehicule).toBe("BENNE");
  });

  it("exists retourne true si le camion existe", async () => {
    const created = await repo.create(baseTruck);
    expect(await repo.exists(created.id)).toBe(true);
    expect(await repo.exists("fake-id")).toBe(false);
  });
});
