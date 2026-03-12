import twilio from "twilio";
import { ISmsProvider, SendSmsOptions } from "../../application/ports/ISmsProvider";

export class TwilioSmsProvider implements ISmsProvider {
  private readonly client: ReturnType<typeof twilio>;
  private readonly from: string;

  constructor() {
    const accountSid = process.env["TWILIO_ACCOUNT_SID"] ?? "";
    const authToken  = process.env["TWILIO_AUTH_TOKEN"]  ?? "";
    this.from        = process.env["TWILIO_PHONE_NUMBER"] ?? "";

    if (!accountSid || !authToken || !this.from) {
      console.warn("[notification-service][Twilio] Credentials manquants — SMS désactivé");
    }

    this.client = twilio(accountSid, authToken);
  }

  async send(options: SendSmsOptions): Promise<void> {
    if (!process.env["TWILIO_ACCOUNT_SID"]) {
      console.log("[notification-service][SMS][DEV]", {
        to: options.to,
        message: options.message,
      });
      return;
    }

    const message = await this.client.messages.create({
      body: options.message,
      from: this.from,
      to: options.to,
    });

    console.log(`[notification-service][Twilio] SMS envoyé à ${options.to} — SID: ${message.sid}`);
  }
}
