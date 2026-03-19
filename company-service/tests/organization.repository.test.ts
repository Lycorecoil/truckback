import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { OrganizationRepository } from "../src/organization/organization.repository";
import { Organization } from "../src/organization/organization.entity";

/**
 * Tests d'intégration du OrganizationRepository.
 * On utilise mongodb-memory-server pour démarrer un MongoDB en mémoire,
 * sans toucher à la base de données réelle.
 */

let mongoServer: MongoMemoryServer;
let repository: OrganizationRepository;

// Données de base pour les tests
const baseData: Omit<Organization, "id"> = {
  tenantId: "tenant-test-001",
  type: "EXPEDITEUR",
  statut: "ACTIVE",
  raisonSociale: "Test Sarl",
  formeJuridique: "SARL",
  rccm: "RCCM-TEST",
  ifu: "IFU-TEST",
  secteurActivite: "Logistique",
  pays: "Bénin",
  ville: "Cotonou",
  email: "test@test.bj",
  telephone: "+22960000000",
  nomRepresentant: "Martin",
  prenomRepresentant: "Paul",
  fonctionRepresentant: "Gérant",
  emailRepresentant: "paul@test.bj",
  telephoneRepresentant: "+22960000001",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Démarre MongoDB en mémoire avant tous les tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  repository = new OrganizationRepository();
});

// Nettoie la collection après chaque test pour l'isolation
afterEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

// Ferme la connexion après tous les tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("OrganizationRepository", () => {

  // ─── create ───────────────────────────────────────────────────────────────

  describe("create", () => {
    it("crée une organisation avec un UUID généré automatiquement", async () => {
      const org = await repository.create(baseData);

      expect(org.id).toBeDefined();
      expect(typeof org.id).toBe("string");
      expect(org.raisonSociale).toBe("Test Sarl");
      expect(org.tenantId).toBe("tenant-test-001");
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe("findById", () => {
    it("trouve une organisation par son UUID", async () => {
      const created = await repository.create(baseData);
      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it("retourne null si l'UUID n'existe pas", async () => {
      const found = await repository.findById("uuid-inexistant");
      expect(found).toBeNull();
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe("findAll", () => {
    it("retourne les organisations paginées", async () => {
      // Crée 3 organisations avec des tenantId différents
      await repository.create({ ...baseData, tenantId: "t1" });
      await repository.create({ ...baseData, tenantId: "t2" });
      await repository.create({ ...baseData, tenantId: "t3" });

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(3);
      expect(result.totalPages).toBe(1);
    });

    it("applique la pagination correctement", async () => {
      await repository.create({ ...baseData, tenantId: "t1" });
      await repository.create({ ...baseData, tenantId: "t2" });
      await repository.create({ ...baseData, tenantId: "t3" });

      const result = await repository.findAll({ page: 1, limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.totalPages).toBe(2);
    });

    it("filtre par type", async () => {
      await repository.create({ ...baseData, tenantId: "t1", type: "EXPEDITEUR" });
      await repository.create({ ...baseData, tenantId: "t2", type: "TRANSPORTER" });

      const result = await repository.findAll({ page: 1, limit: 10, filters: { type: "EXPEDITEUR" } });

      expect(result.total).toBe(1);
      expect(result.data[0]!.type).toBe("EXPEDITEUR");
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe("update", () => {
    it("met à jour les champs fournis", async () => {
      const created = await repository.create(baseData);
      const updated = await repository.update(created.id, { ville: "Porto-Novo" });

      expect(updated.ville).toBe("Porto-Novo");
      expect(updated.raisonSociale).toBe("Test Sarl"); // inchangé
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("supprime une organisation", async () => {
      const created = await repository.create(baseData);
      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  // ─── exists ───────────────────────────────────────────────────────────────

  describe("exists", () => {
    it("retourne true si l'organisation existe", async () => {
      const created = await repository.create(baseData);
      expect(await repository.exists(created.id)).toBe(true);
    });

    it("retourne false si l'organisation n'existe pas", async () => {
      expect(await repository.exists("uuid-inexistant")).toBe(false);
    });
  });

  // ─── findByTenantId ───────────────────────────────────────────────────────

  describe("findByTenantId", () => {
    it("trouve une organisation par tenantId", async () => {
      await repository.create(baseData);
      const found = await repository.findByTenantId("tenant-test-001");

      expect(found).not.toBeNull();
      expect(found!.tenantId).toBe("tenant-test-001");
    });

    it("retourne null si le tenantId n'existe pas", async () => {
      const found = await repository.findByTenantId("tenant-inconnu");
      expect(found).toBeNull();
    });
  });
});
