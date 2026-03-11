import { SendPushUseCase } from './SendPushUseCase';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IPushProvider } from '../ports/IPushProvider';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

const makeRepoMock = (): jest.Mocked<INotificationRepository> => ({
  save: jest.fn().mockImplementation((n: Notification) => Promise.resolve(n)),
  findByRecipientId: jest.fn(),
});

const makePushMock = (): jest.Mocked<IPushProvider> => ({
  send: jest.fn().mockResolvedValue(undefined),
});

describe('SendPushUseCase', () => {
  it('should send a push notification and return status SENT', async () => {
    const repo = makeRepoMock();
    const provider = makePushMock();
    const useCase = new SendPushUseCase(repo, provider);

    const result = await useCase.execute({
      recipientId: 'user-123',
      deviceToken: 'fcm-token-abc',
      title: 'Nouvelle mission',
      body: 'Une expédition vous attend.',
    });

    expect(provider.send).toHaveBeenCalledWith({
      deviceToken: 'fcm-token-abc',
      title: 'Nouvelle mission',
      body: 'Une expédition vous attend.',
    });
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(result.channel).toBe(NotificationChannel.PUSH);
  });

  it('should save notification with status FAILED when provider throws', async () => {
    const repo = makeRepoMock();
    const provider = makePushMock();
    provider.send.mockRejectedValue(new Error('FCM error'));
    const useCase = new SendPushUseCase(repo, provider);

    const result = await useCase.execute({
      recipientId: 'user-123',
      deviceToken: 'fcm-token-abc',
      title: 'Test',
      body: 'Test body',
    });

    expect(result.status).toBe(NotificationStatus.FAILED);
  });
});
