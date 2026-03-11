import express from "express";
import request from "supertest";
import { createTrackingRouter } from "../src/tracking/tracking.controller";
import type { TrackingService } from "../src/tracking/tracking.service";

const mockPoint = {
  id: "tp-uuid-1",
  truckId: "truck-1",
  shipmentId: "ship-1",
  latitude: 3.848,
  longitude: 11.502,
  vitesse: 80,
  timestamp: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockService = {
  addPoint:          jest.fn(),
  getLatestByTruck:  jest.fn(),
  getHistoryByTruck: jest.fn(),
  getByShipment:     jest.fn(),
  createOne:         jest.fn(),
  getById:           jest.fn(),
  getAll:            jest.fn(),
  updateOne:         jest.fn(),
} as unknown as TrackingService;

const app = express();
app.use(express.json());
app.use("/tracking", createTrackingRouter(mockService));

beforeEach(() => jest.clearAllMocks());

describe("TrackingController - RBAC", () => {

  describe("POST /tracking (envoi GPS)", () => {
    const validBody = {
      truckId: "truck-1",
      shipmentId: "ship-1",
      latitude: 3.848,
      longitude: 11.502,
      vitesse: 80,
    };

    it("403 si role COMPANY", async () => {
      const res = await request(app)
        .post("/tracking")
        .set("x-user-role", "COMPANY")
        .set("x-user-id", "company-1")
        .send(validBody);
      expect(res.status).toBe(403);
      expect(mockService.addPoint).not.toHaveBeenCalled();
    });

    it("403 si role TRANSPORTER", async () => {
      const res = await request(app)
        .post("/tracking")
        .set("x-user-role", "TRANSPORTER")
        .set("x-user-id", "trans-1")
        .send(validBody);
      expect(res.status).toBe(403);
      expect(mockService.addPoint).not.toHaveBeenCalled();
    });

    it("403 si aucun role (header absent)", async () => {
      const res = await request(app)
        .post("/tracking")
        .send(validBody);
      expect(res.status).toBe(403);
    });

    it("201 si role DRIVER", async () => {
      (mockService.addPoint as jest.Mock).mockResolvedValue(mockPoint);
      const res = await request(app)
        .post("/tracking")
        .set("x-user-role", "DRIVER")
        .set("x-user-id", "driver-1")
        .send(validBody);
      expect(res.status).toBe(201);
      expect(mockService.addPoint).toHaveBeenCalledTimes(1);
    });

    it("201 si role ADMIN", async () => {
      (mockService.addPoint as jest.Mock).mockResolvedValue(mockPoint);
      const res = await request(app)
        .post("/tracking")
        .set("x-user-role", "ADMIN")
        .set("x-user-id", "admin-1")
        .send(validBody);
      expect(res.status).toBe(201);
    });

    it("400 si champs requis manquants (role DRIVER)", async () => {
      const res = await request(app)
        .post("/tracking")
        .set("x-user-role", "DRIVER")
        .set("x-user-id", "driver-1")
        .send({ truckId: "truck-1" }); // latitude/longitude manquants
      expect(res.status).toBe(400);
      expect(mockService.addPoint).not.toHaveBeenCalled();
    });
  });

  describe("GET /tracking/truck/:truckId (tous roles)", () => {
    it("200 si role COMPANY", async () => {
      (mockService.getLatestByTruck as jest.Mock).mockResolvedValue(mockPoint);
      const res = await request(app)
        .get("/tracking/truck/truck-1")
        .set("x-user-role", "COMPANY");
      expect(res.status).toBe(200);
    });

    it("200 si role TRANSPORTER", async () => {
      (mockService.getLatestByTruck as jest.Mock).mockResolvedValue(mockPoint);
      const res = await request(app)
        .get("/tracking/truck/truck-1")
        .set("x-user-role", "TRANSPORTER");
      expect(res.status).toBe(200);
    });

    it("200 si role DRIVER", async () => {
      (mockService.getLatestByTruck as jest.Mock).mockResolvedValue(mockPoint);
      const res = await request(app)
        .get("/tracking/truck/truck-1")
        .set("x-user-role", "DRIVER");
      expect(res.status).toBe(200);
    });

    it("404 si aucun point GPS enregistre", async () => {
      (mockService.getLatestByTruck as jest.Mock).mockResolvedValue(null);
      const res = await request(app)
        .get("/tracking/truck/truck-inconnu")
        .set("x-user-role", "COMPANY");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /tracking/truck/:truckId/history (tous roles)", () => {
    it("200 si role COMPANY avec historique", async () => {
      (mockService.getHistoryByTruck as jest.Mock).mockResolvedValue([mockPoint, mockPoint]);
      const res = await request(app)
        .get("/tracking/truck/truck-1/history")
        .set("x-user-role", "COMPANY");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /tracking/shipment/:shipmentId (tous roles)", () => {
    it("200 si role TRANSPORTER", async () => {
      (mockService.getByShipment as jest.Mock).mockResolvedValue([mockPoint]);
      const res = await request(app)
        .get("/tracking/shipment/ship-1")
        .set("x-user-role", "TRANSPORTER");
      expect(res.status).toBe(200);
    });
  });

});
