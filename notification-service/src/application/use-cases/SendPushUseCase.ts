import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IPushProvider } from '../ports/IPushProvider';
import { SendPushDTO, SendPushResponseDTO } from '../dtos/SendPushDTO';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

export class SendPushUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly pushProvider: IPushProvider,
  ) {}

  async execute(dto: SendPushDTO): Promise<SendPushResponseDTO> {
    let status = NotificationStatus.SENT;

    try {
      await this.pushProvider.send({ deviceToken: dto.deviceToken, title: dto.title, body: dto.body });
    } catch {
      status = NotificationStatus.FAILED;
    }

    const notification = new Notification({
      recipientId: dto.recipientId,
      channel: NotificationChannel.PUSH,
      message: `${dto.title}: ${dto.body}`,
      status,
    });

    const saved = await this.notificationRepository.save(notification);

    return { id: saved.id, recipientId: saved.recipientId, channel: 'PUSH', status: saved.status };
  }
}
