import { PrismaClient } from '@prisma/client';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

const prisma = new PrismaClient();

export class PrismaNotificationRepository implements INotificationRepository {
  private toDomain(data: {
    id: string;
    recipientId: string;
    channel: string;
    message: string;
    status: string;
    createdAt: Date;
  }): Notification {
    return new Notification({
      id: data.id,
      recipientId: data.recipientId,
      channel: data.channel as NotificationChannel,
      message: data.message,
      status: data.status as NotificationStatus,
      createdAt: data.createdAt,
    });
  }

  async save(notification: Notification): Promise<Notification> {
    const data = await prisma.notification.create({
      data: {
        id: notification.id,
        recipientId: notification.recipientId,
        channel: notification.channel,
        message: notification.message,
        status: notification.status,
        createdAt: notification.createdAt,
      },
    });
    return this.toDomain(data);
  }

  async findByRecipientId(recipientId: string): Promise<Notification[]> {
    const data = await prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d) => this.toDomain(d));
  }
}
