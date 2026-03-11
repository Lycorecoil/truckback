import { GetUserNotificationsUseCase } from './GetUserNotificationsUseCase';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

const makeRepoMock = (): jest.Mocked<INotificationRepository> => ({
  save: jest.fn(),
  findByRecipientId: jest.fn(),
});

describe('GetUserNotificationsUseCase', () => {
  it('should return notifications for a given userId', async () => {
    const repo = makeRepoMock();
    const notification = new Notification({
      recipientId: 'user-123',
      channel: NotificationChannel.EMAIL,
      message: 'Bienvenue',
      status: NotificationStatus.SENT,
    });
    repo.findByRecipientId.mockResolvedValue([notification]);
    const useCase = new GetUserNotificationsUseCase(repo);

    const result = await useCase.execute({ userId: 'user-123' });

    expect(repo.findByRecipientId).toHaveBeenCalledWith('user-123');
    expect(result).toHaveLength(1);
    expect(result[0].recipientId).toBe('user-123');
    expect(result[0].channel).toBe(NotificationChannel.EMAIL);
  });

  it('should return an empty array if no notifications exist', async () => {
    const repo = makeRepoMock();
    repo.findByRecipientId.mockResolvedValue([]);
    const useCase = new GetUserNotificationsUseCase(repo);

    const result = await useCase.execute({ userId: 'user-999' });

    expect(result).toEqual([]);
  });
});
