import { randomUUID } from "crypto";
import { IRepository, QueryOptions, PaginatedResult } from "@jb226/generic-service";
import { Organization } from "./organization.entity";
import { OrganizationModel } from "./organization.model";

/**
 * OrganizationRepository implémente IRepository<Organization>.
 * C'est la seule couche qui parle directement à MongoDB via Mongoose.
 * Le Service ne connaît pas Mongoose — il passe uniquement par ce repository.
 */
export class OrganizationRepository implements IRepository<Organization> {

  /**
   * Trouve une organisation par son UUID (champ id, pas _id MongoDB).
   */
  async findById(id: string): Promise<Organization | null> {
    const doc = await OrganizationModel.findOne({ id }).lean();
    return doc as Organization | null;
  }

  /**
   * Récupère toutes les organisations avec pagination, tri et filtres.
   * QueryOptions vient du package générique.
   */
  async findAll(options: QueryOptions): Promise<PaginatedResult<Organization>> {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", filters = {} } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;

    // Exécution en parallèle pour les performances
    const [data, total] = await Promise.all([
      OrganizationModel.find(filters).sort(sort).skip(skip).limit(limit).lean(),
      OrganizationModel.countDocuments(filters),
    ]);

    return {
      data: data as Organization[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Crée une nouvelle organisation.
   * L'id UUID est généré ici (pas par MongoDB).
   */
  async create(data: Omit<Organization, "id">): Promise<Organization> {
    const doc = await OrganizationModel.create({
      ...data,
      id: randomUUID(),
    });
    return doc.toJSON() as Organization;
  }

  /**
   * Met à jour une organisation existante par son UUID.
   * Retourne le document mis à jour.
   */
  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const doc = await OrganizationModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" } // retourne le document après modification
    ).lean();

    if (!doc) {
      throw new Error(`Organisation ${id} introuvable pour la mise à jour.`);
    }

    return doc as Organization;
  }

  /**
   * Supprime une organisation par son UUID.
   */
  async delete(id: string): Promise<void> {
    await OrganizationModel.deleteOne({ id });
  }

  /**
   * Vérifie si une organisation existe par son UUID.
   */
  async exists(id: string): Promise<boolean> {
    const count = await OrganizationModel.countDocuments({ id });
    return count > 0;
  }

  /**
   * Méthode custom (hors IRepository) :
   * Trouve une organisation par tenantId pour faire le lien avec Auth Service.
   */
  async findByTenantId(tenantId: string): Promise<Organization | null> {
    const doc = await OrganizationModel.findOne({ tenantId }).lean();
    return doc as Organization | null;
  }
}
