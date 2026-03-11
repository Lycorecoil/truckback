export interface INotificationClient {
  sendEmail(to: string, subject: string, body: string, recipientId: string): Promise<void>;
}
