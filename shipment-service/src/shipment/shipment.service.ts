import { GenericService } from "@jb226/generic-service";
import type { Shipment, ShipmentStatus } from "./shipment.entity";
import type { ShipmentRepository } from "./shipment.repository";

const FLEET_SERVICE_URL = process.env["FLEET_SERVICE_URL"] ?? "http://localhost:3003";

export class ShipmentService extends GenericService<Shipment> {
  constructor(private readonly shipmentRepo: ShipmentRepository) {
    super(shipmentRepo);
  }

  async findByCompanyId(companyId: string): Promise<Shipment[]> {
    return this.shipmentRepo.findByCompanyId(companyId);
  }

  async findByTransporterId(transporterId: string): Promise<Shipment[]> {
    return this.shipmentRepo.findByTransporterId(transporterId);
  }

  async findByStatut(statut: ShipmentStatus): Promise<Shipment[]> {
    return this.shipmentRepo.findByStatut(statut);
  }

  // Recherche les camions compatibles dans le fleet-service
  async searchMatchingTrucks(params: {
    poids: number;
    villeDepart: string;
    paysDepart: string;
    typeVehicule?: string;
  }): Promise<unknown[]> {
    const query = new URLSearchParams({
      poids: String(params.poids),
      villeDepart: params.villeDepart,
      paysDepart: params.paysDepart,
    });
    if (params.typeVehicule) query.append("typeVehicule", params.typeVehicule);

    const response = await fetch(`${FLEET_SERVICE_URL}/trucks/match?${query.toString()}`);
    if (!response.ok) throw new Error("Erreur lors de la recherche de camions");
    return response.json() as Promise<unknown[]>;
  }

  // Acceptation avec lock atomique — évite la race condition
  async acceptShipment(
    id: string,
    data: { transporterId: string; truckId: string; driverId: string }
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepo.acceptIfPending(id, data);
    if (!shipment) {
      throw new Error("Cette annonce n'est plus disponible (déjà acceptée ou annulée)");
    }
    return shipment;
  }

  async startMission(id: string): Promise<Shipment> {
    return this.shipmentRepo.update(id, { statut: "IN_PROGRESS" });
  }

  async deliverMission(id: string): Promise<Shipment> {
    return this.shipmentRepo.update(id, { statut: "DELIVERED" });
  }
}
