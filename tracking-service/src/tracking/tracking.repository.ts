import { randomUUID } from "crypto";
import type { IRepository, PaginatedResult, QueryOptions } from "@jb226/generic-service";
import { paginate, buildFilters } from "@jb226/generic-service";
import { TrackingPointModel } from "./tracking.model";
import type { TrackingPoint } from "./tracking.entity";

export class TrackingRepository implements IRepository<TrackingPoint> {
  async findById(id: string): Promise<TrackingPoint | null> {
    const doc = await TrackingPointModel.findOne({ id });
    return doc ? (doc.toJSON() as TrackingPoint) : null;
  }

  async findAll(options: QueryOptions): Promise<PaginatedResult<TrackingPoint>> {
    const { page, limit, sortBy = "timestamp", sortOrder = "desc", filters } = options;
    const { offset } = paginate({ page, limit });
    const query = buildFilters(filters);
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [docs, total] = await Promise.all([
      TrackingPointModel.find(query).sort(sort).skip(offset).limit(limit),
      TrackingPointModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => d.toJSON() as TrackingPoint),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Omit<TrackingPoint, "id">): Promise<TrackingPoint> {
    const doc = await TrackingPointModel.create({ ...data, id: randomUUID() });
    return doc.toJSON() as TrackingPoint;
  }

  async update(id: string, data: Partial<TrackingPoint>): Promise<TrackingPoint> {
    const doc = await TrackingPointModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    if (!doc) throw new Error(`TrackingPoint ${id} introuvable`);
    return doc.toJSON() as TrackingPoint;
  }

  async delete(_id: string): Promise<void> {
    // Les points de tracking ne sont pas supprimés (données historiques)
  }

  async exists(id: string): Promise<boolean> {
    return (await TrackingPointModel.exists({ id })) !== null;
  }

  // Méthodes métier spécifiques

  async findByShipmentId(shipmentId: string): Promise<TrackingPoint[]> {
    const docs = await TrackingPointModel.find({ shipmentId }).sort({ timestamp: -1 });
    return docs.map((d) => d.toJSON() as TrackingPoint);
  }

  async findLatestByTruckId(truckId: string): Promise<TrackingPoint | null> {
    const doc = await TrackingPointModel.findOne({ truckId }).sort({ timestamp: -1 });
    return doc ? (doc.toJSON() as TrackingPoint) : null;
  }

  async findHistoryByTruckId(truckId: string): Promise<TrackingPoint[]> {
    const docs = await TrackingPointModel.find({ truckId }).sort({ timestamp: -1 });
    return docs.map((d) => d.toJSON() as TrackingPoint);
  }
}
