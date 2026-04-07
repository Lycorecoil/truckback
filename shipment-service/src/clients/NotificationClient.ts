import { fetchWithRetry } from "../utils/fetchWithTimeout";
import { logger } from "../utils/logger";

const NOTIFICATION_SERVICE_URL = process.env["NOTIFICATION_SERVICE_URL"] ?? "http://localhost:3005";

export async function sendEmail(
  recipientId: string,
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  try {
    await fetchWithRetry(
      `${NOTIFICATION_SERVICE_URL}/notification/email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, to, subject, body }),
      },
    );
  } catch (err) {
    logger.error({ err, recipientId }, "[shipment-service][NotificationClient] Erreur envoi email après retries");
  }
}

export async function sendPush(
  recipientId: string,
  deviceToken: string,
  title: string,
  body: string,
): Promise<void> {
  if (!deviceToken) return;
  try {
    await fetchWithRetry(
      `${NOTIFICATION_SERVICE_URL}/notification/push`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, deviceToken, title, body }),
      },
    );
  } catch (err) {
    logger.error({ err, recipientId }, "[shipment-service][NotificationClient] Erreur envoi push après retries");
  }
}
