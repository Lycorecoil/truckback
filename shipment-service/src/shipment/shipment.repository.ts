import { randomUUID } from "crypto";
import type { IRepository, PaginatedResult, QueryOptions } from "@jb226/generic-service";
import { paginate, buildFilters } from "@jb226/generic-service";
import { ShipmentModel } from "./shipment.model";
import type { Shipment, ShipmentStatus } from "./shipment.entity";

export class ShipmentRepository implements IRepository<Shipment> {
  async findById(id: string): Promise<Shipment | null> {
    const doc = await ShipmentModel.findOne({ id });
    return doc ? (doc.toJSON() as Shipment) : null;
  }

  async findAll(options: QueryOptions): Promise<PaginatedResult<Shipment>> {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", filters } = options;
    const { offset } = paginate({ page, limit });
    const query = buildFilters(filters);
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [docs, total] = await Promise.all([
      ShipmentModel.find(query).sort(sort).skip(offset).limit(limit),
      ShipmentModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => d.toJSON() as Shipment),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Omit<Shipment, "id">): Promise<Shipment> {
    const doc = await ShipmentModel.create({ ...data, id: randomUUID() });
    return doc.toJSON() as Shipment;
  }

  async update(id: string, data: Partial<Shipment>): Promise<Shipment> {
    const doc = await ShipmentModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    if (!doc) throw new Error(`Shipment ${id} not found`);
    return doc.toJSON() as Shipment;
  }

  // Lock atomique : accepte SEULEMENT si statut est encore PENDING
  // Empêche la race condition si deux transporteurs acceptent en même temps
  async acceptIfPending(
    id: string,
    data: { transporterId: string; transporterTenantId?: string; truckId: string; driverId: string }
  ): Promise<Shipment | null> {
    const doc = await ShipmentModel.findOneAndUpdate(
      { id, statut: "PENDING" },
      { $set: { ...data, statut: "ACCEPTED" } },
      { returnDocument: "after" }
    );
    return doc ? (doc.toJSON() as Shipment) : null;
  }

  async delete(id: string): Promise<void> {
    await ShipmentModel.findOneAndDelete({ id });
  }

  async exists(id: string): Promise<boolean> {
    const count = await ShipmentModel.countDocuments({ id });
    return count > 0;
  }

  async findByCompanyId(companyId: string): Promise<Shipment[]> {
    const docs = await ShipmentModel.find({ companyId }).sort({ createdAt: -1 });
    return docs.map((d) => d.toJSON() as Shipment);
  }

  async findByTransporterId(transporterId: string): Promise<Shipment[]> {
    const docs = await ShipmentModel.find({ transporterId }).sort({ createdAt: -1 });
    return docs.map((d) => d.toJSON() as Shipment);
  }

  async findByStatut(statut: ShipmentStatus): Promise<Shipment[]> {
    const docs = await ShipmentModel.find({ statut }).sort({ createdAt: -1 });
    return docs.map((d) => d.toJSON() as Shipment);
  }

  async findByDriverId(driverId: string): Promise<Shipment[]> {
    const docs = await ShipmentModel.find({ driverId }).sort({ createdAt: -1 });
    return docs.map((d) => d.toJSON() as Shipment);
  }
}
