import { NotificationChannel } from '../../domain/entities/Notification';

export interface CreateTemplateDTO {
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
}

export interface CreateTemplateResponseDTO {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
}
