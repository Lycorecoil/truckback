import { ISmsProvider, SendSmsOptions } from "../../application/ports/ISmsProvider";

const AT_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging";
const AT_PROD_URL = "https://api.africastalking.com/version1/messaging";

export class AfricasTalkingSmsProvider implements ISmsProvider {
  private readonly apiKey: string;
  private readonly username: string;
  private readonly senderId: string;
  private readonly isSandbox: boolean;
  private readonly apiUrl: string;

  constructor() {
    this.apiKey = process.env["AT_API_KEY"] ?? "";
    this.username = process.env["AT_USERNAME"] ?? "sandbox";
    this.senderId = process.env["AT_SENDER_ID"] ?? "CamionUber";
    this.isSandbox = process.env["AT_SANDBOX"] !== "false";
    this.apiUrl = this.isSandbox ? AT_SANDBOX_URL : AT_PROD_URL;
  }

  async send(options: SendSmsOptions): Promise<void> {
    if (!this.apiKey) {
      // Fallback dev si pas de clé configurée
      console.log("[notification-service][SMS][DEV]", {
        to: options.to,
        message: options.message,
      });
      return;
    }

    const body = new URLSearchParams({
      username: this.username,
      to: options.to,
      message: options.message,
      from: this.senderId,
    });

    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": this.apiKey,
      },
      body: body.toString(),
    });

    const data = await res.json() as { SMSMessageData?: { Recipients?: Array<{ status: string; number: string }> } };

    const recipients = data.SMSMessageData?.Recipients ?? [];
    recipients.forEach((r) => {
      if (r.status === "Success") {
        console.log(`[notification-service][SMS] Envoyé à ${r.number} (${this.isSandbox ? "sandbox" : "prod"})`);
      } else {
        console.warn(`[notification-service][SMS] Échec pour ${r.number}: ${r.status}`);
      }
    });

    if (!res.ok) {
      throw new Error(`[AfricasTalking] SMS failed (${res.status})`);
    }
  }
}
