export interface SendSmsOptions {
  to: string;
  message: string;
}

export interface ISmsProvider {
  send(options: SendSmsOptions): Promise<void>;
}
