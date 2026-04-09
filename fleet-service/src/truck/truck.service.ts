import { GenericService } from "@jb226/generic-service";
import type { Truck } from "./truck.entity";
import type { TruckRepository, MatchCriteria } from "./truck.repository";

export class TruckService extends GenericService<Truck> {
  constructor(private readonly truckRepo: TruckRepository) {
    super(truckRepo);
  }

  async findByTenantId(tenantId: string): Promise<Truck[]> {
    return this.truckRepo.findByTenantId(tenantId);
  }

  async findAvailable(tenantId: string): Promise<Truck[]> {
    return this.truckRepo.findAvailable(tenantId);
  }

  async findMatching(criteria: MatchCriteria): Promise<Truck[]> {
    return this.truckRepo.findMatching(criteria);
  }

  async assignDriver(truckId: string, driverId: string): Promise<Truck> {
    // Règle 1 : le chauffeur ne peut pas être déjà assigné à un autre camion
    const existing = await this.truckRepo.findByDriverId(driverId);
    if (existing && existing.id !== truckId) {
      throw Object.assign(new Error("Ce chauffeur est déjà assigné à un autre camion"), { statusCode: 409 });
    }

    // Règle 2 : le camion ne peut pas avoir un autre chauffeur déjà assigné
    const truck = await this.truckRepo.findById(truckId);
    if (truck && truck.driverId && truck.driverId !== driverId) {
      throw Object.assign(new Error("Ce camion a déjà un chauffeur assigné — désassignez-le d'abord"), { statusCode: 409 });
    }

    return this.truckRepo.update(truckId, { driverId });
  }

  async findByDriverId(driverId: string): Promise<Truck | null> {
    return this.truckRepo.findByDriverId(driverId);
  }

  async unassignDriver(truckId: string): Promise<Truck> {
    const truck = await this.truckRepo.findById(truckId);
    if (truck?.statut === "BUSY") {
      throw Object.assign(new Error("Impossible de désassigner : ce camion est actuellement en mission"), { statusCode: 409 });
    }
    return this.truckRepo.update(truckId, { driverId: null as unknown as undefined });
  }
}
