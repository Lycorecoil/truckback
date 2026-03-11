import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { ISmsProvider } from '../ports/ISmsProvider';
import { SendSmsDTO, SendSmsResponseDTO } from '../dtos/SendSmsDTO';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

export class SendSmsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly smsProvider: ISmsProvider,
  ) {}

  async execute(dto: SendSmsDTO): Promise<SendSmsResponseDTO> {
    let status = NotificationStatus.SENT;

    try {
      await this.smsProvider.send({ to: dto.to, message: dto.message });
    } catch {
      status = NotificationStatus.FAILED;
    }

    const notification = new Notification({
      recipientId: dto.recipientId,
      channel: NotificationChannel.SMS,
      message: dto.message,
      status,
    });

    const saved = await this.notificationRepository.save(notification);

    return { id: saved.id, recipientId: saved.recipientId, channel: 'SMS', status: saved.status };
  }
}
