import { GenericService } from "@jb226/generic-service";
import type { Driver } from "./driver.entity";
import type { DriverRepository } from "./driver.repository";

export class DriverService extends GenericService<Driver> {
  constructor(private readonly driverRepo: DriverRepository) {
    super(driverRepo);
  }

  async findByTenantId(tenantId: string, excludeDeleted = false): Promise<Driver[]> {
    return this.driverRepo.findByTenantId(tenantId, excludeDeleted);
  }
}
