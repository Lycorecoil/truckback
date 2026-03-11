import express from "express";
import request from "supertest";
import { createShipmentRouter } from "../src/shipment/shipment.controller";
import type { ShipmentService } from "../src/shipment/shipment.service";

const mockShipment = {
  id: "s-uuid-1",
  companyId: "company-uuid-1",
  poids: 5000,
  villeDepart: "Douala",
  paysDepart: "Cameroun",
  villeArrivee: "Yaounde",
  paysArrivee: "Cameroun",
  marchandise: "Ciment",
  statut: "PENDING",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockService = {
  createOne:            jest.fn(),
  getById:              jest.fn(),
  getAll:               jest.fn(),
  updateOne:            jest.fn(),
  findByCompanyId:      jest.fn(),
  findByTransporterId:  jest.fn(),
  findByStatut:         jest.fn(),
  findByDriverId:       jest.fn(),
  acceptShipment:       jest.fn(),
  startMission:         jest.fn(),
  deliverMission:       jest.fn(),
  cancelShipment:       jest.fn(),
  searchMatchingTrucks: jest.fn(),
} as unknown as ShipmentService;

const app = express();
app.use(express.json());
app.use("/shipments", createShipmentRouter(mockService));

beforeEach(() => jest.clearAllMocks());

describe("ShipmentController - RBAC et isolation tenant", () => {

  describe("POST /shipments", () => {
    it("403 si role TRANSPORTER", async () => {
      const res = await request(app)
        .post("/shipments")
        .set("x-user-role", "TRANSPORTER")
        .set("x-user-id", "trans-1")
        .send({ poids: 5000 });
      expect(res.status).toBe(403);
    });

    it("403 si role DRIVER", async () => {
      const res = await request(app)
        .post("/shipments")
        .set("x-user-role", "DRIVER")
        .set("x-user-id", "driver-1")
        .send({ poids: 5000 });
      expect(res.status).toBe(403);
    });

    it("201 COMPANY - companyId injecte depuis x-user-id, pas depuis le body", async () => {
      (mockService.createOne as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockShipment, companyId: "company-from-jwt" },
      });
      const res = await request(app)
        .post("/shipments")
        .set("x-user-role", "COMPANY")
        .set("x-user-id", "company-from-jwt")
        .send({
          marchandise: "Ciment", villeDepart: "Douala", paysDepart: "Cameroun",
          villeArrivee: "Yaounde", paysArrivee: "Cameroun",
          dateAnnonce: "2026-04-01", heureAnnonce: "08:00",
          poids: 5000, quantite: 10,
          companyId: "forged-id", // tentative de forge
        });
      expect(res.status).toBe(201);
      const callArg = (mockService.createOne as jest.Mock).mock.calls[0][0] as Record<string, string>;
      expect(callArg["companyId"]).toBe("company-from-jwt");
    });
  });

  describe("POST /shipments/:id/accept", () => {
    it("403 si role COMPANY", async () => {
      const res = await request(app)
        .post("/shipments/s-uuid-1/accept")
        .set("x-user-role", "COMPANY")
        .set("x-user-id", "company-1")
        .send({ truckId: "t1", driverId: "d1" });
      expect(res.status).toBe(403);
    });

    it("403 si role DRIVER", async () => {
      const res = await request(app)
        .post("/shipments/s-uuid-1/accept")
        .set("x-user-role", "DRIVER")
        .set("x-user-id", "driver-1")
        .send({ truckId: "t1", driverId: "d1" });
      expect(res.status).toBe(403);
    });

    it("200 TRANSPORTER - transporterId injecte depuis x-user-id", async () => {
      (mockService.acceptShipment as jest.Mock).mockResolvedValue({
        ...mockShipment, statut: "ACCEPTED", transporterId: "trans-jwt",
      });
      const res = await request(app)
        .post("/shipments/s-uuid-1/accept")
        .set("x-user-role", "TRANSPORTER")
        .set("x-user-id", "trans-jwt")
        .send({ truckId: "t1", driverId: "d1", transporterId: "forged-id" });
      expect(res.status).toBe(200);
      const callArg = (mockService.acceptShipment as jest.Mock).mock.calls[0] as [string, { transporterId: string }];
      expect(callArg[1].transporterId).toBe("trans-jwt");
    });
  });

  describe("POST /shipments/:id/start", () => {
    it("403 si role COMPANY", async () => {
      const res = await request(app)
        .post("/shipments/s-uuid-1/start")
        .set("x-user-role", "COMPANY");
      expect(res.status).toBe(403);
    });

    it("403 si role TRANSPORTER", async () => {
      const res = await request(app)
        .post("/shipments/s-uuid-1/start")
        .set("x-user-role", "TRANSPORTER");
      expect(res.status).toBe(403);
    });

    it("200 si role DRIVER", async () => {
      (mockService.startMission as jest.Mock).mockResolvedValue({ ...mockShipment, statut: "IN_PROGRESS" });
      const res = await request(app)
        .post("/shipments/s-uuid-1/start")
        .set("x-user-role", "DRIVER")
        .set("x-user-id", "driver-1");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /shipments/:id/deliver", () => {
    it("403 si role TRANSPORTER", async () => {
      const res = await request(app)
        .post("/shipments/s-uuid-1/deliver")
        .set("x-user-role", "TRANSPORTER");
      expect(res.status).toBe(403);
    });

    it("200 si role DRIVER", async () => {
      (mockService.deliverMission as jest.Mock).mockResolvedValue({ ...mockShipment, statut: "DELIVERED" });
      const res = await request(app)
        .post("/shipments/s-uuid-1/deliver")
        .set("x-user-role", "DRIVER")
        .set("x-user-id", "driver-1");
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /shipments/:id (soft delete)", () => {
    it("403 si role TRANSPORTER", async () => {
      const res = await request(app)
        .delete("/shipments/s-uuid-1")
        .set("x-user-role", "TRANSPORTER");
      expect(res.status).toBe(403);
    });

    it("403 si role DRIVER", async () => {
      const res = await request(app)
        .delete("/shipments/s-uuid-1")
        .set("x-user-role", "DRIVER");
      expect(res.status).toBe(403);
    });

    it("200 si role COMPANY", async () => {
      (mockService.cancelShipment as jest.Mock).mockResolvedValue({ ...mockShipment, statut: "CANCELLED" });
      const res = await request(app)
        .delete("/shipments/s-uuid-1")
        .set("x-user-role", "COMPANY")
        .set("x-user-id", "company-1");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /shipments - isolation automatique", () => {
    it("COMPANY voit uniquement ses expeditions (findByCompanyId avec x-user-id)", async () => {
      (mockService.findByCompanyId as jest.Mock).mockResolvedValue([mockShipment]);
      const res = await request(app)
        .get("/shipments")
        .set("x-user-role", "COMPANY")
        .set("x-user-id", "company-jwt");
      expect(res.status).toBe(200);
      expect(mockService.findByCompanyId).toHaveBeenCalledWith("company-jwt");
      expect(mockService.getAll).not.toHaveBeenCalled();
    });

    it("TRANSPORTER voit uniquement ses missions (findByTransporterId avec x-user-id)", async () => {
      (mockService.findByTransporterId as jest.Mock).mockResolvedValue([]);
      const res = await request(app)
        .get("/shipments")
        .set("x-user-role", "TRANSPORTER")
        .set("x-user-id", "trans-jwt");
      expect(res.status).toBe(200);
      expect(mockService.findByTransporterId).toHaveBeenCalledWith("trans-jwt");
    });
  });

  describe("PUT /shipments/:id - ADMIN seulement", () => {
    it("403 si role COMPANY", async () => {
      const res = await request(app)
        .put("/shipments/s-uuid-1")
        .set("x-user-role", "COMPANY")
        .send({ poids: 9999 });
      expect(res.status).toBe(403);
    });

    it("200 si role ADMIN", async () => {
      (mockService.updateOne as jest.Mock).mockResolvedValue({ success: true, data: { ...mockShipment, poids: 9999 } });
      const res = await request(app)
        .put("/shipments/s-uuid-1")
        .set("x-user-role", "ADMIN")
        .send({ poids: 9999 });
      expect(res.status).toBe(200);
    });
  });

  // ─── Validation des entrées ───
  describe("POST /shipments — validation des champs requis", () => {
    it("400 si champs requis manquants (COMPANY)", async () => {
      const res = await request(app)
        .post("/shipments")
        .set("x-user-role", "COMPANY")
        .set("x-user-id", "company-1")
        .send({ poids: 5000 }); // marchandise, villeDepart, etc. manquants
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/marchandise/);
    });

    it("400 si poids invalide (négatif)", async () => {
      const res = await request(app)
        .post("/shipments")
        .set("x-user-role", "COMPANY")
        .set("x-user-id", "company-1")
        .send({
          marchandise: "Ciment", villeDepart: "Douala", paysDepart: "Cameroun",
          villeArrivee: "Yaounde", paysArrivee: "Cameroun",
          dateAnnonce: "2026-04-01", heureAnnonce: "08:00",
          poids: -100, quantite: 5,
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/poids/);
    });

    it("201 COMPANY avec tous les champs valides", async () => {
      (mockService.createOne as jest.Mock).mockResolvedValue({
        success: true, data: { ...mockShipment, companyId: "company-1" },
      });
      const res = await request(app)
        .post("/shipments")
        .set("x-user-role", "COMPANY")
        .set("x-user-id", "company-1")
        .send({
          marchandise: "Ciment", villeDepart: "Douala", paysDepart: "Cameroun",
          villeArrivee: "Yaounde", paysArrivee: "Cameroun",
          dateAnnonce: "2026-04-01", heureAnnonce: "08:00",
          poids: 5000, quantite: 10,
        });
      expect(res.status).toBe(201);
    });
  });

  // ─── DRIVER isolation ───
  describe("GET /shipments — DRIVER voit uniquement ses expéditions", () => {
    it("DRIVER voit uniquement ses missions (findByDriverId avec x-user-id)", async () => {
      (mockService.findByDriverId as jest.Mock).mockResolvedValue([mockShipment]);
      const res = await request(app)
        .get("/shipments")
        .set("x-user-role", "DRIVER")
        .set("x-user-id", "driver-jwt");
      expect(res.status).toBe(200);
      expect(mockService.findByDriverId).toHaveBeenCalledWith("driver-jwt");
      expect(mockService.getAll).not.toHaveBeenCalled();
      expect(mockService.findByCompanyId).not.toHaveBeenCalled();
    });
  });

});
