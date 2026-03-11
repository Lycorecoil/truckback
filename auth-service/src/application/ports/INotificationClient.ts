export interface INotificationClient {
  sendEmail(to: string, subject: string, body: string, recipientId: string): Promise<void>;
  sendSms(to: string, message: string, recipientId: string): Promise<void>;
}
