import { fetchWithRetry } from "../utils/fetchWithTimeout";
import { logger } from "../utils/logger";

const FLEET_SERVICE_URL     = process.env["FLEET_SERVICE_URL"]      ?? "http://localhost:3003";
const INTERNAL_SERVICE_SECRET = process.env["INTERNAL_SERVICE_SECRET"] ?? "";

export async function setTruckStatus(truckId: string, statut: "AVAILABLE" | "BUSY"): Promise<void> {
  try {
    const res = await fetchWithRetry(`${FLEET_SERVICE_URL}/trucks/${truckId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SERVICE_SECRET },
      body: JSON.stringify({ statut }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn({ truckId, statut, status: res.status, text }, "[shipment-service][FleetClient] Échec mise à jour statut camion");
    }
  } catch (err) {
    logger.error({ err, truckId, statut }, "[shipment-service][FleetClient] Erreur mise à jour statut camion");
  }
}

export async function setDriverStatus(driverId: string, statut: "AVAILABLE" | "BUSY"): Promise<void> {
  try {
    const res = await fetchWithRetry(`${FLEET_SERVICE_URL}/drivers/${driverId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SERVICE_SECRET },
      body: JSON.stringify({ statut }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn({ driverId, statut, status: res.status, text }, "[shipment-service][FleetClient] Échec mise à jour statut chauffeur");
    }
  } catch (err) {
    logger.error({ err, driverId, statut }, "[shipment-service][FleetClient] Erreur mise à jour statut chauffeur");
  }
}

export async function getDriverPlayerId(driverId: string): Promise<string | null> {
  try {
    const res = await fetchWithRetry(`${FLEET_SERVICE_URL}/drivers/${driverId}`, {
      headers: { "x-internal-secret": INTERNAL_SERVICE_SECRET },
    });
    if (!res.ok) return null;
    const data = await res.json() as { data?: { oneSignalPlayerId?: string }; oneSignalPlayerId?: string };
    const driver = data.data ?? data;
    return driver.oneSignalPlayerId ?? null;
  } catch (err) {
    logger.error({ err, driverId }, "[shipment-service][FleetClient] Erreur récupération playerId chauffeur");
    return null;
  }
}
