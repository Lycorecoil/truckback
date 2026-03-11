import { ITemplateRepository } from "../../domain/repositories/ITemplateRepository";
import { NotificationTemplate } from "../../domain/entities/NotificationTemplate";
import { NotificationChannel } from "../../domain/entities/Notification";
import { TemplateModel } from "../db/TemplateModel";

export class MongoTemplateRepository implements ITemplateRepository {
  private toDomain(data: { id: string; name: string; channel: string; subject?: string | null; body: string }): NotificationTemplate {
    return new NotificationTemplate({
      id: data.id,
      name: data.name,
      channel: data.channel as NotificationChannel,
      subject: data.subject ?? undefined,
      body: data.body,
    });
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const doc = await TemplateModel.findOne({ name });
    return doc ? this.toDomain(doc) : null;
  }

  async save(template: NotificationTemplate): Promise<NotificationTemplate> {
    const existing = await TemplateModel.findOne({ id: template.id });
    if (existing) {
      await TemplateModel.updateOne(
        { id: template.id },
        { $set: { name: template.name, channel: template.channel, subject: template.subject, body: template.body } },
      );
      const updated = await TemplateModel.findOne({ id: template.id });
      return this.toDomain(updated!);
    }
    const doc = await TemplateModel.create({
      id: template.id,
      name: template.name,
      channel: template.channel,
      subject: template.subject,
      body: template.body,
    });
    return this.toDomain(doc);
  }
}
