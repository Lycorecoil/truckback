import { INotificationClient } from "../../application/ports/INotificationClient";

export class NotificationClient implements INotificationClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env["NOTIFICATION_SERVICE_URL"] ?? "http://localhost:3005";
  }

  async sendEmail(to: string, subject: string, body: string, recipientId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/notification/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body, recipientId }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[NotificationClient] sendEmail failed (${res.status}): ${text}`);
    }
  }

  async sendSms(to: string, message: string, recipientId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/notification/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message, recipientId }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[NotificationClient] sendSms failed (${res.status}): ${text}`);
    }
  }
}
