import { GenericService } from "@jb226/generic-service";
import type { BaseEntity, ServiceResponse } from "@jb226/generic-service";
import type { Shipment, ShipmentStatus } from "./shipment.entity";
import type { ShipmentRepository } from "./shipment.repository";
import { sendEmail } from "../clients/NotificationClient";
import { setTruckStatus, setDriverStatus, getDriverPlayerId } from "../clients/FleetClient";
import { fetchWithRetry } from "../utils/fetchWithTimeout";
import { withCircuitBreaker } from "../utils/circuitBreaker";
import { getOrganizationEmail } from "../clients/CompanyClient";
import { sendPush } from "../clients/NotificationClient";

const FLEET_SERVICE_URL = process.env["FLEET_SERVICE_URL"] ?? "http://localhost:3003";
const FALLBACK_EMAIL = process.env["FALLBACK_EMAIL"] ?? "ilboudojeanbaptiste41@gmail.com";

async function resolveEmail(tenantId: string | undefined, type: "company" | "transporter"): Promise<string> {
  if (!tenantId) return FALLBACK_EMAIL;
  return (await getOrganizationEmail(tenantId, type)) ?? FALLBACK_EMAIL;
}

export class ShipmentService extends GenericService<Shipment> {
  constructor(readonly shipmentRepo: ShipmentRepository) {
    super(shipmentRepo);
  }

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

      const transporterTenantIds = [
        ...new Set((trucks as Array<{ tenantId: string }>).map((t) => t.tenantId)),
      ];

      for (const tenantId of transporterTenantIds) {
        const email = await resolveEmail(tenantId, "transporter");
        void sendEmail(
          tenantId,
          email,
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

  async findByDriverId(driverId: string): Promise<Shipment[]> {
    return this.shipmentRepo.findByDriverId(driverId);
  }

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

    const response = await withCircuitBreaker('fleet-service', () =>
      fetchWithRetry(`${FLEET_SERVICE_URL}/trucks/match?${query.toString()}`),
    );
    if (!response.ok) throw new Error("Erreur lors de la recherche de camions");
    return response.json() as Promise<unknown[]>;
  }

  async acceptShipment(
    id: string,
    data: { transporterId: string; transporterTenantId?: string; truckId: string; driverId: string }
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepo.acceptIfPending(id, data);
    if (!shipment) {
      throw new Error("Cette annonce n'est plus disponible (déjà acceptée ou annulée)");
    }
    void setTruckStatus(data.truckId, "BUSY");
    void setDriverStatus(data.driverId, "BUSY");
    const companyEmail = await resolveEmail(shipment.companyTenantId, "company");
    void sendEmail(
      shipment.companyId,
      companyEmail,
      "Votre annonce a été acceptée",
      `Bonne nouvelle ! Un transporteur a accepté votre annonce pour ${shipment.marchandise} de ${shipment.villeDepart} vers ${shipment.villeArrivee}.`,
    );
    // Push notification au chauffeur
    const playerId = await getDriverPlayerId(data.driverId);
    void sendPush(
      data.driverId,
      playerId ?? "",
      "Nouvelle mission assignée 🚛",
      `${shipment.marchandise} — ${shipment.villeDepart} → ${shipment.villeArrivee}`,
    );
    return shipment;
  }

  async startMission(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.update(id, { statut: "IN_PROGRESS" });
    const companyEmail = await resolveEmail(shipment.companyTenantId, "company");
    void sendEmail(
      shipment.companyId,
      companyEmail,
      "Votre livraison est en cours",
      `Le chauffeur a démarré la mission pour ${shipment.marchandise}. Départ : ${shipment.villeDepart} → Arrivée : ${shipment.villeArrivee}.`,
    );
    return shipment;
  }

  async deliverMission(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.update(id, { statut: "DELIVERED" });
    if (shipment.truckId)  void setTruckStatus(shipment.truckId, "AVAILABLE");
    if (shipment.driverId) void setDriverStatus(shipment.driverId, "AVAILABLE");
    const companyEmail = await resolveEmail(shipment.companyTenantId, "company");
    void sendEmail(
      shipment.companyId,
      companyEmail,
      "Livraison confirmée",
      `Votre marchandise (${shipment.marchandise}) a bien été livrée à ${shipment.villeArrivee}.`,
    );
    return shipment;
  }

  async cancelInterest(id: string, transporterId: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.removeInterest(id, transporterId);
    if (!shipment) {
      throw Object.assign(new Error("Expédition introuvable ou intérêt non trouvé"), { statusCode: 404 });
    }
    return shipment;
  }

  async expressInterest(
    id: string,
    data: { transporterId: string; transporterTenantId?: string; truckId?: string }
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepo.addInterest(id, { ...data, createdAt: new Date() });
    if (!shipment) {
      throw Object.assign(new Error("Expédition introuvable, déjà pourvue, ou intérêt déjà manifesté"), { statusCode: 409 });
    }
    // Notifier l'admin par email
    const adminEmail = process.env["ADMIN_EMAIL"] ?? FALLBACK_EMAIL;
    void sendEmail(
      "admin",
      adminEmail,
      "Nouveau transporteur intéressé",
      `Un transporteur a manifesté son intérêt pour l'expédition ${id} (${shipment.marchandise} — ${shipment.villeDepart} → ${shipment.villeArrivee}).`,
    );
    return shipment;
  }

  async proposeToTransporter(
    id: string,
    data: { transporterId: string; transporterTenantId?: string }
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepo.proposeToTransporter(id, data);
    if (!shipment) {
      throw new Error("Expédition introuvable ou déjà pourvue");
    }
    // Notifier le transporteur
    const transporterEmail = await resolveEmail(data.transporterTenantId, "transporter");
    void sendEmail(
      data.transporterId,
      transporterEmail,
      "Une mission vous a été proposée",
      `Elimmekatruck vous propose une mission : ${shipment.marchandise} (${shipment.poids} T) — ${shipment.villeDepart} → ${shipment.villeArrivee}. Connectez-vous pour accepter ou refuser.`,
    );
    return shipment;
  }

  async acceptProposal(
    id: string,
    transporterTenantId: string,
    transporterId: string,
    data: { truckId: string; driverId: string }
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepo.acceptProposal(id, transporterTenantId, transporterId, data);
    if (!shipment) {
      throw new Error("Proposition introuvable ou déjà traitée");
    }
    void setTruckStatus(data.truckId, "BUSY");
    void setDriverStatus(data.driverId, "BUSY");
    const companyEmail = await resolveEmail(shipment.companyTenantId, "company");
    void sendEmail(
      shipment.companyId,
      companyEmail,
      "Votre annonce a été acceptée",
      `Un transporteur a accepté votre annonce pour ${shipment.marchandise} de ${shipment.villeDepart} vers ${shipment.villeArrivee}.`,
    );
    // Push notification au chauffeur
    const playerId = await getDriverPlayerId(data.driverId);
    void sendPush(
      data.driverId,
      playerId ?? "",
      "Nouvelle mission assignée 🚛",
      `${shipment.marchandise} — ${shipment.villeDepart} → ${shipment.villeArrivee}`,
    );
    return shipment;
  }

  async refuseProposal(id: string, transporterTenantId: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.refuseProposal(id, transporterTenantId);
    if (!shipment) {
      throw new Error("Proposition introuvable ou déjà traitée");
    }
    return shipment;
  }

  async cancelShipment(id: string, commentaireAnnulation?: string): Promise<Shipment> {
    const updateData: Partial<Shipment> = { statut: "CANCELLED" };
    if (commentaireAnnulation) updateData.commentaireAnnulation = commentaireAnnulation;
    const shipment = await this.shipmentRepo.update(id, updateData);
    if (shipment.truckId)  void setTruckStatus(shipment.truckId, "AVAILABLE");
    if (shipment.driverId) void setDriverStatus(shipment.driverId, "AVAILABLE");
    if (shipment.transporterId) {
      const transporterEmail = await resolveEmail(shipment.transporterTenantId, "transporter");
      void sendEmail(
        shipment.transporterId,
        transporterEmail,
        "Annonce annulée",
        `L'annonce que vous aviez acceptée a été annulée par l'expéditeur : ${shipment.marchandise} de ${shipment.villeDepart} vers ${shipment.villeArrivee}.`,
      );
    }
    return shipment;
  }
}
