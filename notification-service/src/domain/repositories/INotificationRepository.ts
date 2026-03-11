import { Notification } from '../entities/Notification';

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findByRecipientId(recipientId: string): Promise<Notification[]>;
}
