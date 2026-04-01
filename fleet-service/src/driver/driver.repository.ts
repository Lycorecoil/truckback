import { randomUUID } from "crypto";
import type { IRepository, PaginatedResult, QueryOptions } from "@jb226/generic-service";
import { paginate, buildFilters } from "@jb226/generic-service";
import { DriverModel } from "./driver.model";
import type { Driver } from "./driver.entity";

export class DriverRepository implements IRepository<Driver> {
  async findById(id: string): Promise<Driver | null> {
    const doc = await DriverModel.findOne({ id });
    return doc ? (doc.toJSON() as Driver) : null;
  }

  async findAll(options: QueryOptions): Promise<PaginatedResult<Driver>> {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", filters } = options;
    const { offset } = paginate({ page, limit });
    const query = buildFilters(filters);
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [docs, total] = await Promise.all([
      DriverModel.find(query).sort(sort).skip(offset).limit(limit),
      DriverModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => d.toJSON() as Driver),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Omit<Driver, "id"> & { id?: string }): Promise<Driver> {
    const doc = await DriverModel.create({ ...data, id: data.id ?? randomUUID() });
    return doc.toJSON() as Driver;
  }

  async update(id: string, data: Partial<Driver>): Promise<Driver> {
    const doc = await DriverModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    if (!doc) throw new Error(`Driver ${id} not found`);
    return doc.toJSON() as Driver;
  }

  async delete(id: string): Promise<void> {
    await DriverModel.findOneAndDelete({ id });
  }

  async exists(id: string): Promise<boolean> {
    const count = await DriverModel.countDocuments({ id });
    return count > 0;
  }

  async findByTenantId(tenantId: string, excludeDeleted = false): Promise<Driver[]> {
    const query: Record<string, unknown> = { tenantId };
    if (excludeDeleted) query['statut'] = { $ne: 'DELETED' };
    const docs = await DriverModel.find(query);
    return docs.map((d) => d.toJSON() as Driver);
  }
}
