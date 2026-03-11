const NOTIFICATION_SERVICE_URL = process.env["NOTIFICATION_SERVICE_URL"] ?? "http://localhost:3005";

export async function sendEmail(
  recipientId: string,
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/notification/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, to, subject, body }),
    });
  } catch (err) {
    // Non-bloquant : log l'erreur sans faire échouer la requête principale
    console.error("[shipment-service][NotificationClient] Erreur envoi email :", err);
  }
}
