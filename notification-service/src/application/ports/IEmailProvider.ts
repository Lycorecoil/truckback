export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
}

export interface IEmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}
