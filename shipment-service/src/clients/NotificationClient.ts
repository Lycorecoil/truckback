import { fetchWithTimeout } from "../utils/fetchWithTimeout";

const NOTIFICATION_SERVICE_URL = process.env["NOTIFICATION_SERVICE_URL"] ?? "http://localhost:3005";

export async function sendEmail(
  recipientId: string,
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  try {
    await fetchWithTimeout(
      `${NOTIFICATION_SERVICE_URL}/notification/email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, to, subject, body }),
      },
      5_000,
    );
  } catch (err) {
    console.error("[shipment-service][NotificationClient] Erreur envoi email :", err);
  }
}
