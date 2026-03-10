import { randomUUID } from "crypto";
import type { IRepository, PaginatedResult, QueryOptions } from "@jb226/generic-service";
import { paginate, buildFilters } from "@jb226/generic-service";
import { TruckModel } from "./truck.model";
import type { Truck } from "./truck.entity";

export interface MatchCriteria {
  poids: number;
  typeVehicule?: string;
  villeDepart: string;
  paysDepart: string;
}

export class TruckRepository implements IRepository<Truck> {
  async findById(id: string): Promise<Truck | null> {
    const doc = await TruckModel.findOne({ id });
    return doc ? (doc.toJSON() as Truck) : null;
  }

  async findAll(options: QueryOptions): Promise<PaginatedResult<Truck>> {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", filters } = options;
    const { offset } = paginate({ page, limit });
    const query = buildFilters(filters);
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [docs, total] = await Promise.all([
      TruckModel.find(query).sort(sort).skip(offset).limit(limit),
      TruckModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => d.toJSON() as Truck),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Omit<Truck, "id">): Promise<Truck> {
    const doc = await TruckModel.create({ ...data, id: randomUUID() });
    return doc.toJSON() as Truck;
  }

  async update(id: string, data: Partial<Truck>): Promise<Truck> {
    const doc = await TruckModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    if (!doc) throw new Error(`Truck ${id} not found`);
    return doc.toJSON() as Truck;
  }

  async delete(id: string): Promise<void> {
    await TruckModel.findOneAndDelete({ id });
  }

  async exists(id: string): Promise<boolean> {
    const count = await TruckModel.countDocuments({ id });
    return count > 0;
  }

  async findByTenantId(tenantId: string): Promise<Truck[]> {
    const docs = await TruckModel.find({ tenantId });
    return docs.map((d) => d.toJSON() as Truck);
  }

  async findAvailable(tenantId: string): Promise<Truck[]> {
    const docs = await TruckModel.find({ tenantId, statut: "AVAILABLE" });
    return docs.map((d) => d.toJSON() as Truck);
  }

  async findMatching(criteria: MatchCriteria): Promise<Truck[]> {
    const query: Record<string, unknown> = {
      statut: "AVAILABLE",
      capaciteMax: { $gte: criteria.poids },
      villeBase: criteria.villeDepart,
      paysBase: criteria.paysDepart,
    };
    if (criteria.typeVehicule) {
      query["typeVehicule"] = criteria.typeVehicule;
    }
    const docs = await TruckModel.find(query);
    return docs.map((d) => d.toJSON() as Truck);
  }
}
