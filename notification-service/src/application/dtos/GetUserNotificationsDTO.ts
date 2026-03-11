import { NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

export interface GetUserNotificationsDTO {
  userId: string;
}

export interface NotificationItemDTO {
  id: string;
  recipientId: string;
  channel: NotificationChannel;
  message: string;
  status: NotificationStatus;
  createdAt: Date;
}

export type GetUserNotificationsResponseDTO = NotificationItemDTO[];
