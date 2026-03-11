import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { GetUserNotificationsDTO, GetUserNotificationsResponseDTO } from '../dtos/GetUserNotificationsDTO';

export class GetUserNotificationsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(dto: GetUserNotificationsDTO): Promise<GetUserNotificationsResponseDTO> {
    const notifications = await this.notificationRepository.findByRecipientId(dto.userId);

    return notifications.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      channel: n.channel,
      message: n.message,
      status: n.status,
      createdAt: n.createdAt,
    }));
  }
}
