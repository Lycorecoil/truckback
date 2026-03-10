import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ShipmentRepository } from "../src/shipment/shipment.repository";
import type { Shipment } from "../src/shipment/shipment.entity";

let mongoServer: MongoMemoryServer;
let repo: ShipmentRepository;

const baseShipment: Omit<Shipment, "id"> = {
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

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  repo = new ShipmentRepository();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await mongoose.connection.dropDatabase();
});

describe("ShipmentRepository", () => {
  it("create genere un UUID et statut PENDING par defaut", async () => {
    const created = await repo.create(baseShipment);
    expect(created.id).toBeDefined();
    expect(created.statut).toBe("PENDING");
    expect(created.marchandise).toBe("Ciment");
  });

  it("findById retourne le bon shipment", async () => {
    const created = await repo.create(baseShipment);
    const found = await repo.findById(created.id);
    expect(found?.villeDepart).toBe("Cotonou");
  });

  it("findByCompanyId filtre par expediteur", async () => {
    await repo.create(baseShipment);
    await repo.create({ ...baseShipment, companyId: "company-2", villeDepart: "Parakou" });
    const results = await repo.findByCompanyId("company-uuid-1");
    expect(results).toHaveLength(1);
  });

  it("findByStatut filtre par statut", async () => {
    const s1 = await repo.create(baseShipment);
    await repo.create({ ...baseShipment, villeDepart: "Parakou" });
    await repo.update(s1.id, { statut: "ACCEPTED" });
    const pending = await repo.findByStatut("PENDING");
    expect(pending).toHaveLength(1);
    expect(pending[0]?.statut).toBe("PENDING");
  });

  it("acceptIfPending passe a ACCEPTED si statut etait PENDING", async () => {
    const created = await repo.create(baseShipment);
    const accepted = await repo.acceptIfPending(created.id, {
      transporterId: "transporteur-1",
      truckId: "truck-1",
      driverId: "driver-1",
    });
    expect(accepted).not.toBeNull();
    expect(accepted?.statut).toBe("ACCEPTED");
    expect(accepted?.transporterId).toBe("transporteur-1");
  });

  it("acceptIfPending retourne null si deja ACCEPTED (race condition)", async () => {
    const created = await repo.create(baseShipment);
    await repo.update(created.id, { statut: "ACCEPTED" });
    const result = await repo.acceptIfPending(created.id, {
      transporterId: "transporteur-2",
      truckId: "truck-2",
      driverId: "driver-2",
    });
    expect(result).toBeNull();
  });

  it("update modifie le statut", async () => {
    const created = await repo.create(baseShipment);
    const updated = await repo.update(created.id, { statut: "IN_PROGRESS" });
    expect(updated.statut).toBe("IN_PROGRESS");
  });
});
