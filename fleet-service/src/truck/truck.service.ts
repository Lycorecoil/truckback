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
    return this.truckRepo.update(truckId, { driverId, statut: "BUSY" });
  }

  async unassignDriver(truckId: string): Promise<Truck> {
    return this.truckRepo.update(truckId, { driverId: undefined, statut: "AVAILABLE" });
  }
}
