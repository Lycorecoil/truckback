import nodemailer from "nodemailer";
import { IEmailProvider, SendEmailOptions } from "../../application/ports/IEmailProvider";

export class NodemailerEmailProvider implements IEmailProvider {
  private transporter = nodemailer.createTransport({
    host: process.env["SMTP_HOST"] ?? "smtp.gmail.com",
    port: Number(process.env["SMTP_PORT"] ?? 587),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  });

  async send(options: SendEmailOptions): Promise<void> {
    if (!process.env["SMTP_USER"] || !process.env["SMTP_PASS"]) {
      // Mode dev sans SMTP configuré — log uniquement
      console.log("[notification-service][EMAIL][DEV]", {
        to: options.to,
        subject: options.subject,
        body: options.body,
      });
      return;
    }

    await this.transporter.sendMail({
      from: process.env["SMTP_FROM"] ?? process.env["SMTP_USER"],
      to: options.to,
      subject: options.subject,
      text: options.body,
    });

    console.log(`[notification-service][EMAIL] Envoyé à ${options.to}`);
  }
}
