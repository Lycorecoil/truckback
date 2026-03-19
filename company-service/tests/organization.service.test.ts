import { OrganizationService } from "../src/organization/organization.service";
import { OrganizationRepository } from "../src/organization/organization.repository";
import { Organization } from "../src/organization/organization.entity";
import { PaginatedResult, QueryOptions } from "@jb226/generic-service";

/**
 * Tests unitaires du OrganizationService.
 * On mocke entièrement le repository pour isoler le service.
 * Aucune connexion MongoDB n'est nécessaire ici.
 */

// Mock automatique de la classe repository — Jest remplace toutes les méthodes par des jest.fn()
jest.mock("../src/organization/organization.repository");

// Organisation de test réutilisable
const mockOrg: Organization = {
  id: "uuid-1234",
  tenantId: "tenant-abc",
  type: "EXPEDITEUR",
  statut: "ACTIVE",
  raisonSociale: "ACME Sarl",
  formeJuridique: "SARL",
  rccm: "RCCM-001",
  ifu: "IFU-001",
  secteurActivite: "Commerce",
  pays: "Bénin",
  ville: "Cotonou",
  email: "contact@acme.bj",
  telephone: "+22961000000",
  nomRepresentant: "Dupont",
  prenomRepresentant: "Jean",
  fonctionRepresentant: "Directeur",
  emailRepresentant: "jean@acme.bj",
  telephoneRepresentant: "+22961000001",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQueryOptions: QueryOptions = { page: 1, limit: 10 };

describe("OrganizationService", () => {
  let service: OrganizationService;
  let repository: jest.Mocked<OrganizationRepository>;

  beforeEach(() => {
    // Récupère l'instance mockée du repository
    repository = new OrganizationRepository() as jest.Mocked<OrganizationRepository>;
    service = new OrganizationService(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("retourne une organisation si elle existe", async () => {
      repository.findById.mockResolvedValue(mockOrg);
      repository.exists.mockResolvedValue(true);

      const result = await service.getById("uuid-1234");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrg);
    });

    it("lève une erreur si l'organisation n'existe pas", async () => {
      repository.findById.mockResolvedValue(null);
      repository.exists.mockResolvedValue(false);

      // GenericService lève NotFoundError quand exists() retourne false
      await expect(service.getById("id-inexistant")).rejects.toThrow();
    });
  });

  // ─── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("retourne une liste paginée d'organisations", async () => {
      const paginated: PaginatedResult<Organization> = {
        data: [mockOrg],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      repository.findAll.mockResolvedValue(paginated);

      const result = await service.getAll(mockQueryOptions);

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });
  });

  // ─── createOne ──────────────────────────────────────────────────────────────

  describe("createOne", () => {
    it("crée et retourne une nouvelle organisation", async () => {
      const { id, ...dataWithoutId } = mockOrg;
      repository.create.mockResolvedValue(mockOrg);

      const result = await service.createOne(dataWithoutId);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe("uuid-1234");
      expect(repository.create).toHaveBeenCalledWith(dataWithoutId);
    });
  });

  // ─── updateOne ──────────────────────────────────────────────────────────────

  describe("updateOne", () => {
    it("met à jour et retourne l'organisation modifiée", async () => {
      const updated = { ...mockOrg, ville: "Porto-Novo" };
      repository.exists.mockResolvedValue(true);
      repository.update.mockResolvedValue(updated);

      const result = await service.updateOne("uuid-1234", { ville: "Porto-Novo" });

      expect(result.success).toBe(true);
      expect(result.data.ville).toBe("Porto-Novo");
    });

    it("lève une erreur si l'organisation n'existe pas", async () => {
      repository.exists.mockResolvedValue(false);

      await expect(service.updateOne("id-inexistant", { ville: "X" })).rejects.toThrow();
    });
  });

  // ─── deleteOne ──────────────────────────────────────────────────────────────

  describe("deleteOne (soft delete)", () => {
    it("suspend une organisation via updateOne({ statut: SUSPENDED })", async () => {
      const suspended = { ...mockOrg, statut: "SUSPENDED" as const };
      repository.exists.mockResolvedValue(true);
      repository.update.mockResolvedValue(suspended);

      // Le controller appelle updateOne avec statut SUSPENDED, pas deleteOne
      const result = await service.updateOne("uuid-1234", { statut: "SUSPENDED" });

      expect(result.success).toBe(true);
      expect(result.data.statut).toBe("SUSPENDED");
      expect(repository.update).toHaveBeenCalledWith("uuid-1234", { statut: "SUSPENDED" });
    });
  });

  // ─── getByTenantId ──────────────────────────────────────────────────────────

  describe("getByTenantId", () => {
    it("retourne l'organisation liée au tenantId", async () => {
      repository.findByTenantId.mockResolvedValue(mockOrg);

      const result = await service.getByTenantId("tenant-abc");

      expect(result.success).toBe(true);
      expect(result.data.tenantId).toBe("tenant-abc");
    });

    it("retourne null si aucune organisation n'est liée au tenantId", async () => {
      repository.findByTenantId.mockResolvedValue(null);

      const result = await service.getByTenantId("tenant-inconnu");

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  // ─── getByType ──────────────────────────────────────────────────────────────

  describe("getByType", () => {
    it("filtre les organisations par type EXPEDITEUR", async () => {
      const paginated: PaginatedResult<Organization> = {
        data: [mockOrg],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      repository.findAll.mockResolvedValue(paginated);

      const result = await service.getByType("EXPEDITEUR", mockQueryOptions);

      expect(result.success).toBe(true);
      // Vérifie que findAll a bien été appelé avec le filtre type
      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ type: "EXPEDITEUR" }) })
      );
    });
  });
});
