import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { TrackingRepository } from "../src/tracking/tracking.repository";

let mongoServer: MongoMemoryServer;
const repo = new TrackingRepository();

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

const basePoint = {
  truckId: "truck-1",
  shipmentId: "shipment-1",
  latitude: 6.3654,
  longitude: 2.4183,
  timestamp: new Date("2025-06-15T08:00:00Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("TrackingRepository", () => {
  it("create puis findById retourne le point", async () => {
    const created = await repo.create(basePoint);
    expect(created.id).toBeDefined();
    const found = await repo.findById(created.id);
    expect(found?.truckId).toBe("truck-1");
    expect(found?.latitude).toBe(6.3654);
  });

  it("findByShipmentId retourne tous les points de l'expédition", async () => {
    await repo.create(basePoint);
    await repo.create({ ...basePoint, latitude: 6.4, timestamp: new Date("2025-06-15T08:10:00Z") });
    const points = await repo.findByShipmentId("shipment-1");
    expect(points).toHaveLength(2);
  });

  it("findLatestByTruckId retourne le point le plus récent", async () => {
    await repo.create(basePoint);
    await repo.create({ ...basePoint, latitude: 6.5, timestamp: new Date("2025-06-15T09:00:00Z") });
    const latest = await repo.findLatestByTruckId("truck-1");
    expect(latest?.latitude).toBe(6.5);
  });

  it("findHistoryByTruckId retourne tous les points du camion", async () => {
    await repo.create(basePoint);
    await repo.create({ ...basePoint, latitude: 6.5, timestamp: new Date("2025-06-15T09:00:00Z") });
    await repo.create({ ...basePoint, truckId: "truck-2" });
    const history = await repo.findHistoryByTruckId("truck-1");
    expect(history).toHaveLength(2);
    history.forEach((p) => expect(p.truckId).toBe("truck-1"));
  });

  it("findByShipmentId retourne tableau vide si aucun point", async () => {
    const points = await repo.findByShipmentId("shipment-inexistant");
    expect(points).toHaveLength(0);
  });

  it("findLatestByTruckId retourne null si camion inconnu", async () => {
    const latest = await repo.findLatestByTruckId("truck-inconnu");
    expect(latest).toBeNull();
  });
});
