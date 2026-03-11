import express from "express";
import request from "supertest";
import { createTruckRouter } from "../src/truck/truck.controller";
import type { TruckService } from "../src/truck/truck.service";

// Service mocké — pas de base de données
const mockService = {
  createOne:       jest.fn(),
  getById:         jest.fn(),
  getAll:          jest.fn(),
  updateOne:       jest.fn(),
  findByTenantId:  jest.fn(),
  findAvailable:   jest.fn(),
  findMatching:    jest.fn(),
  assignDriver:    jest.fn(),
  unassignDriver:  jest.fn(),
} as unknown as TruckService;

// App Express minimale — pas de connexion MongoDB
const app = express();
app.use(express.json());
app.use("/fleet/trucks", createTruckRouter(mockService));

beforeEach(() => jest.clearAllMocks());

describe("TruckController — RBAC & tenant isolation", () => {

  // ─── POST /fleet/trucks ───
  describe("POST /fleet/trucks", () => {
    it("403 si rôle COMPANY", async () => {
      const res = await request(app)
        .post("/fleet/trucks")
        .set("x-user-role", "COMPANY")
        .set("x-tenant-id", "tenant-1")
        .send({ immatriculation: "AB-001" });
      expect(res.status).toBe(403);
    });

    it("403 si rôle DRIVER", async () => {
      const res = await request(app)
        .post("/fleet/trucks")
        .set("x-user-role", "DRIVER")
        .set("x-tenant-id", "tenant-1")
        .send({ immatriculation: "AB-001" });
      expect(res.status).toBe(403);
    });

    it("400 si champs requis manquants (TRANSPORTER)", async () => {
      const res = await request(app)
        .post("/fleet/trucks")
        .set("x-user-role", "TRANSPORTER")
        .set("x-tenant-id", "tenant-jwt")
        .send({ immatriculation: "AB-001" }); // marque, modele, etc. manquants
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/marque/);
    });

    it("400 si capaciteMax invalide", async () => {
      const res = await request(app)
        .post("/fleet/trucks")
        .set("x-user-role", "TRANSPORTER")
        .set("x-tenant-id", "tenant-jwt")
        .send({ immatriculation: "AB-001", marque: "Mercedes", modele: "Actros",
                typeVehicule: "BENNE", villeBase: "Cotonou", paysBase: "Benin", capaciteMax: -5 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/capaciteMax/);
    });

    it("201 si rôle TRANSPORTER — tenantId injecté depuis le header JWT", async () => {
      (mockService.createOne as jest.Mock).mockResolvedValue({
        success: true, data: { id: "uuid-1", tenantId: "tenant-jwt", immatriculation: "AB-001" },
      });
      const validTruck = {
        immatriculation: "AB-001", marque: "Mercedes", modele: "Actros",
        typeVehicule: "BENNE", villeBase: "Cotonou", paysBase: "Benin",
        capaciteMax: 15000, tenantId: "tenant-forged", // tentative de forge
      };
      const res = await request(app)
        .post("/fleet/trucks")
        .set("x-user-role", "TRANSPORTER")
        .set("x-tenant-id", "tenant-jwt")
        .send(validTruck);
      expect(res.status).toBe(201);
      const callArg = (mockService.createOne as jest.Mock).mock.calls[0][0] as Record<string, string>;
      expect(callArg["tenantId"]).toBe("tenant-jwt");
    });

    it("201 si rôle ADMIN", async () => {
      (mockService.createOne as jest.Mock).mockResolvedValue({
        success: true, data: { id: "uuid-2", tenantId: "tenant-1" },
      });
      const res = await request(app)
        .post("/fleet/trucks")
        .set("x-user-role", "ADMIN")
        .set("x-tenant-id", "tenant-admin")
        .send({
          immatriculation: "AB-002", marque: "Volvo", modele: "FH16",
          typeVehicule: "BENNE", villeBase: "Douala", paysBase: "Cameroun",
          capaciteMax: 20000, tenantId: "tenant-1",
        });
      expect(res.status).toBe(201);
    });
  });

  // ─── GET /fleet/trucks ───
  describe("GET /fleet/trucks", () => {
    it("TRANSPORTER voit uniquement ses camions (isolation tenant)", async () => {
      (mockService.findByTenantId as jest.Mock).mockResolvedValue([{ id: "t1", tenantId: "tenant-abc" }]);
      const res = await request(app)
        .get("/fleet/trucks")
        .set("x-user-role", "TRANSPORTER")
        .set("x-tenant-id", "tenant-abc");
      expect(res.status).toBe(200);
      expect(mockService.findByTenantId).toHaveBeenCalledWith("tenant-abc");
      expect(mockService.getAll).not.toHaveBeenCalled();
    });

    it("ADMIN voit tous les camions (pas d'isolation forcée)", async () => {
      (mockService.getAll as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
      const res = await request(app)
        .get("/fleet/trucks")
        .set("x-user-role", "ADMIN")
        .set("x-tenant-id", "tenant-admin");
      expect(res.status).toBe(200);
      expect(mockService.getAll).toHaveBeenCalled();
    });

    it("TRANSPORTER avec available=true appelle findAvailable", async () => {
      (mockService.findAvailable as jest.Mock).mockResolvedValue([]);
      const res = await request(app)
        .get("/fleet/trucks?available=true")
        .set("x-user-role", "TRANSPORTER")
        .set("x-tenant-id", "tenant-abc");
      expect(res.status).toBe(200);
      expect(mockService.findAvailable).toHaveBeenCalledWith("tenant-abc");
    });
  });

  // ─── PUT /fleet/trucks/:id ───
  describe("PUT /fleet/trucks/:id", () => {
    it("403 si rôle COMPANY", async () => {
      const res = await request(app)
        .put("/fleet/trucks/uuid-1")
        .set("x-user-role", "COMPANY")
        .send({ marque: "Volvo" });
      expect(res.status).toBe(403);
    });

    it("200 si rôle TRANSPORTER", async () => {
      (mockService.updateOne as jest.Mock).mockResolvedValue({ success: true, data: { id: "uuid-1", marque: "Volvo" } });
      const res = await request(app)
        .put("/fleet/trucks/uuid-1")
        .set("x-user-role", "TRANSPORTER")
        .set("x-tenant-id", "tenant-1")
        .send({ marque: "Volvo" });
      expect(res.status).toBe(200);
    });
  });

  // ─── DELETE /fleet/trucks/:id ───
  describe("DELETE /fleet/trucks/:id (soft delete → MAINTENANCE)", () => {
    it("403 si rôle DRIVER", async () => {
      const res = await request(app)
        .delete("/fleet/trucks/uuid-1")
        .set("x-user-role", "DRIVER");
      expect(res.status).toBe(403);
    });

    it("200 si rôle TRANSPORTER", async () => {
      (mockService.updateOne as jest.Mock).mockResolvedValue({ success: true, data: { id: "uuid-1", statut: "MAINTENANCE" } });
      const res = await request(app)
        .delete("/fleet/trucks/uuid-1")
        .set("x-user-role", "TRANSPORTER")
        .set("x-tenant-id", "tenant-1");
      expect(res.status).toBe(200);
      const callArg = (mockService.updateOne as jest.Mock).mock.calls[0];
      expect(callArg[1]).toEqual({ statut: "MAINTENANCE" });
    });
  });

  // ─── POST /fleet/trucks/assign-driver ───
  describe("POST /fleet/trucks/assign-driver", () => {
    it("403 si rôle COMPANY", async () => {
      const res = await request(app)
        .post("/fleet/trucks/assign-driver")
        .set("x-user-role", "COMPANY")
        .send({ truckId: "t1", driverId: "d1" });
      expect(res.status).toBe(403);
    });

    it("200 si rôle TRANSPORTER", async () => {
      (mockService.assignDriver as jest.Mock).mockResolvedValue({ id: "t1", driverId: "d1", statut: "BUSY" });
      const res = await request(app)
        .post("/fleet/trucks/assign-driver")
        .set("x-user-role", "TRANSPORTER")
        .set("x-tenant-id", "tenant-1")
        .send({ truckId: "t1", driverId: "d1" });
      expect(res.status).toBe(200);
    });
  });

});
