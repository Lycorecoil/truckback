export interface SendPushOptions {
  deviceToken: string;
  title: string;
  body: string;
}

export interface IPushProvider {
  send(options: SendPushOptions): Promise<void>;
}
