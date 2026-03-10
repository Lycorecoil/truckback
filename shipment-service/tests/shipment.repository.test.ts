import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ShipmentRepository } from "../src/shipment/shipment.repository";

let mongoServer: MongoMemoryServer;
const repo = new ShipmentRepository();

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

const baseShipment = {
  companyId: "company-1",
  origine: "Paris",
  destination: "Lyon",
  description: "Palettes de céréales",
  poids: 5000,
  statut: "PENDING" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ShipmentRepository", () => {
  it("create puis findById retourne la mission", async () => {
    const created = await repo.create(baseShipment);
    expect(created.id).toBeDefined();
    const found = await repo.findById(created.id);
    expect(found?.origine).toBe("Paris");
    expect(found?.statut).toBe("PENDING");
  });

  it("update modifie le statut", async () => {
    const created = await repo.create(baseShipment);
    const updated = await repo.update(created.id, {
      statut: "ACCEPTED",
      transporterId: "transporter-1",
      truckId: "truck-1",
      driverId: "driver-1",
    });
    expect(updated.statut).toBe("ACCEPTED");
    expect(updated.transporterId).toBe("transporter-1");
  });

  it("findByCompanyId retourne les missions de la company", async () => {
    await repo.create(baseShipment);
    await repo.create({ ...baseShipment, origine: "Marseille" });
    await repo.create({ ...baseShipment, companyId: "company-2", origine: "Bordeaux" });
    const result = await repo.findByCompanyId("company-1");
    expect(result).toHaveLength(2);
  });

  it("findByTransporterId retourne les missions du transporteur", async () => {
    const s1 = await repo.create(baseShipment);
    const s2 = await repo.create({ ...baseShipment, origine: "Marseille" });
    await repo.update(s1.id, { transporterId: "transporter-1", statut: "ACCEPTED" });
    await repo.update(s2.id, { transporterId: "transporter-1", statut: "ACCEPTED" });
    const result = await repo.findByTransporterId("transporter-1");
    expect(result).toHaveLength(2);
  });

  it("findByStatut retourne les missions PENDING", async () => {
    const s1 = await repo.create(baseShipment);
    await repo.create(baseShipment);
    await repo.update(s1.id, { statut: "ACCEPTED" });
    const pending = await repo.findByStatut("PENDING");
    expect(pending).toHaveLength(1);
    expect(pending[0]?.statut).toBe("PENDING");
  });

  it("exists retourne true si la mission existe", async () => {
    const created = await repo.create(baseShipment);
    expect(await repo.exists(created.id)).toBe(true);
    expect(await repo.exists("fake-id")).toBe(false);
  });
});
