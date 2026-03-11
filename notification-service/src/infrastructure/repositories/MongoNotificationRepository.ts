import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { Notification, NotificationChannel, NotificationStatus } from "../../domain/entities/Notification";
import { NotificationModel } from "../db/NotificationModel";

export class MongoNotificationRepository implements INotificationRepository {
  private toDomain(data: { id: string; recipientId: string; channel: string; message: string; status: string; createdAt: Date }): Notification {
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
    const doc = await NotificationModel.create({
      id: notification.id,
      recipientId: notification.recipientId,
      channel: notification.channel,
      message: notification.message,
      status: notification.status,
      createdAt: notification.createdAt,
    });
    return this.toDomain(doc);
  }

  async findByRecipientId(recipientId: string): Promise<Notification[]> {
    const docs = await NotificationModel.find({ recipientId }).sort({ createdAt: -1 });
    return docs.map((d) => this.toDomain(d));
  }
}
