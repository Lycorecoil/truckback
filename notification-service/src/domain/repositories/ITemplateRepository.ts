import { NotificationTemplate } from '../entities/NotificationTemplate';

export interface ITemplateRepository {
  findByName(name: string): Promise<NotificationTemplate | null>;
  save(template: NotificationTemplate): Promise<NotificationTemplate>;
}
