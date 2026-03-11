import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IEmailProvider } from '../ports/IEmailProvider';
import { SendEmailDTO, SendEmailResponseDTO } from '../dtos/SendEmailDTO';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

export class SendEmailUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(dto: SendEmailDTO): Promise<SendEmailResponseDTO> {
    let status = NotificationStatus.SENT;

    try {
      await this.emailProvider.send({ to: dto.to, subject: dto.subject, body: dto.body });
    } catch {
      status = NotificationStatus.FAILED;
    }

    const notification = new Notification({
      recipientId: dto.recipientId,
      channel: NotificationChannel.EMAIL,
      message: `${dto.subject}: ${dto.body}`,
      status,
    });

    const saved = await this.notificationRepository.save(notification);

    return { id: saved.id, recipientId: saved.recipientId, channel: 'EMAIL', status: saved.status };
  }
}
