import { GenericService } from "@jb226/generic-service";
import type { BaseEntity, ServiceResponse } from "@jb226/generic-service";
import type { Shipment, ShipmentStatus } from "./shipment.entity";
import type { ShipmentRepository } from "./shipment.repository";
import { sendEmail } from "../clients/NotificationClient";

const FLEET_SERVICE_URL = process.env["FLEET_SERVICE_URL"] ?? "http://localhost:3003";

export class ShipmentService extends GenericService<Shipment> {
  constructor(private readonly shipmentRepo: ShipmentRepository) {
    super(shipmentRepo);
  }

  // Override createOne : après création, notifier les transporteurs de la zone
  async createOne(data: Omit<Shipment, keyof BaseEntity>): Promise<ServiceResponse<Shipment>> {
    const response = await super.createOne(data);
    void this.notifyMatchingTransporters(response.data);
    return response;
  }

  private async notifyMatchingTransporters(shipment: Shipment): Promise<void> {
    try {
      const trucks = await this.searchMatchingTrucks({
        poids: shipment.poids,
        villeDepart: shipment.villeDepart,
        paysDepart: shipment.paysDepart,
      });

      const transporterIds = [
        ...new Set((trucks as Array<{ tenantId: string }>).map((t) => t.tenantId)),
      ];

      for (const transporterId of transporterIds) {
        void sendEmail(
          transporterId,
          `transporteur-${transporterId}@camion-uber.internal`,
          "Nouvelle annonce disponible dans votre zone",
          `Une annonce correspond à votre flotte : ${shipment.marchandise} (${shipment.poids} kg) — ${shipment.villeDepart} → ${shipment.villeArrivee}.`,
        );
      }
    } catch (err) {
      console.error("[shipment-service] Erreur notification transporteurs :", err);
    }
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

    const response = await fetch(`${FLEET_SERVICE_URL}/fleet/trucks/match?${query.toString()}`);
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
    // Notifier l'expéditeur : un transporteur a accepté son annonce
    void sendEmail(
      shipment.companyId,
      `expediteur-${shipment.companyId}@camion-uber.internal`,
      "Votre annonce a été acceptée",
      `Bonne nouvelle ! Un transporteur a accepté votre annonce pour ${shipment.marchandise} de ${shipment.villeDepart} vers ${shipment.villeArrivee}.`,
    );
    return shipment;
  }

  async startMission(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.update(id, { statut: "IN_PROGRESS" });
    // Notifier l'expéditeur : le chauffeur est en route
    void sendEmail(
      shipment.companyId,
      `expediteur-${shipment.companyId}@camion-uber.internal`,
      "Votre livraison est en cours",
      `Le chauffeur a démarré la mission pour ${shipment.marchandise}. Départ : ${shipment.villeDepart} → Arrivée : ${shipment.villeArrivee}.`,
    );
    return shipment;
  }

  async deliverMission(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.update(id, { statut: "DELIVERED" });
    // Notifier l'expéditeur : livraison confirmée
    void sendEmail(
      shipment.companyId,
      `expediteur-${shipment.companyId}@camion-uber.internal`,
      "Livraison confirmée",
      `Votre marchandise (${shipment.marchandise}) a bien été livrée à ${shipment.villeArrivee}.`,
    );
    return shipment;
  }

  // Annulation : notifier le transporteur s'il était assigné
  async cancelShipment(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.update(id, { statut: "CANCELLED" });
    if (shipment.transporterId) {
      void sendEmail(
        shipment.transporterId,
        `transporteur-${shipment.transporterId}@camion-uber.internal`,
        "Annonce annulée",
        `L'annonce que vous aviez acceptée a été annulée par l'expéditeur : ${shipment.marchandise} de ${shipment.villeDepart} vers ${shipment.villeArrivee}.`,
      );
    }
    return shipment;
  }
}
