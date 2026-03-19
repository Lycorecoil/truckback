import { GenericService, ServiceResponse, QueryOptions, PaginatedResult } from "@jb226/generic-service";
import { Organization } from "./organization.entity";
import { OrganizationRepository } from "./organization.repository";

/**
 * OrganizationService étend GenericService pour hériter du CRUD complet.
 * On peut ajouter ici des méthodes métier spécifiques au domaine Organization.
 *
 * Méthodes héritées de GenericService :
 *  - getById(id)
 *  - getAll(options)
 *  - createOne(data)
 *  - updateOne(id, data)
 *  - deleteOne(id)
 *  - exists(id)
 */
export class OrganizationService extends GenericService<Organization> {
  // On garde une référence au repository pour accéder aux méthodes custom
  private readonly orgRepository: OrganizationRepository;

  constructor(repository: OrganizationRepository) {
    super(repository);
    this.orgRepository = repository;
  }

  /**
   * Méthode métier custom :
   * Récupère le profil d'une organisation via son tenantId (lien avec Auth Service).
   * Utilisée quand on reçoit un JWT et qu'on veut trouver le profil associé.
   */
  async getByTenantId(tenantId: string): Promise<ServiceResponse<Organization>> {
    const org = await this.orgRepository.findByTenantId(tenantId);

    if (!org) {
      return {
        success: true,
        data: null as unknown as Organization,
        message: "Aucune organisation trouvée pour ce tenantId.",
      };
    }

    return { success: true, data: org };
  }

  /**
   * Méthode métier custom :
   * Récupère toutes les organisations filtrées par type (EXPEDITEUR ou TRANSPORTER).
   */
  async getByType(
    type: Organization["type"],
    options: QueryOptions
  ): Promise<ServiceResponse<PaginatedResult<Organization>>> {
    // On injecte le filtre type dans les options
    return this.getAll({
      ...options,
      filters: { ...options.filters, type },
    });
  }
}
