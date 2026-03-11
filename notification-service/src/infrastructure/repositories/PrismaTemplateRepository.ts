import { PrismaClient } from '@prisma/client';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { NotificationTemplate } from '../../domain/entities/NotificationTemplate';
import { NotificationChannel } from '../../domain/entities/Notification';

const prisma = new PrismaClient();

export class PrismaTemplateRepository implements ITemplateRepository {
  private toDomain(data: {
    id: string;
    name: string;
    channel: string;
    subject: string | null;
    body: string;
  }): NotificationTemplate {
    return new NotificationTemplate({
      id: data.id,
      name: data.name,
      channel: data.channel as NotificationChannel,
      subject: data.subject ?? undefined,
      body: data.body,
    });
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const data = await prisma.notificationTemplate.findUnique({ where: { name } });
    return data ? this.toDomain(data) : null;
  }

  async save(template: NotificationTemplate): Promise<NotificationTemplate> {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id: template.id } });
    const data = existing
      ? await prisma.notificationTemplate.update({
          where: { id: template.id },
          data: { name: template.name, channel: template.channel, subject: template.subject, body: template.body },
        })
      : await prisma.notificationTemplate.create({
          data: {
            id: template.id,
            name: template.name,
            channel: template.channel,
            subject: template.subject,
            body: template.body,
          },
        });
    return this.toDomain(data);
  }
}
