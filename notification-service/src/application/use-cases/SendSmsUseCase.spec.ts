import { SendSmsUseCase } from './SendSmsUseCase';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { ISmsProvider } from '../ports/ISmsProvider';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

const makeRepoMock = (): jest.Mocked<INotificationRepository> => ({
  save: jest.fn().mockImplementation((n: Notification) => Promise.resolve(n)),
  findByRecipientId: jest.fn(),
});

const makeSmsMock = (): jest.Mocked<ISmsProvider> => ({
  send: jest.fn().mockResolvedValue(undefined),
});

describe('SendSmsUseCase', () => {
  it('should send an SMS and return status SENT', async () => {
    const repo = makeRepoMock();
    const provider = makeSmsMock();
    const useCase = new SendSmsUseCase(repo, provider);

    const result = await useCase.execute({
      recipientId: 'user-123',
      to: '+22901234567',
      message: 'Votre expédition a été acceptée.',
    });

    expect(provider.send).toHaveBeenCalledWith({
      to: '+22901234567',
      message: 'Votre expédition a été acceptée.',
    });
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(result.channel).toBe(NotificationChannel.SMS);
  });

  it('should save notification with status FAILED when provider throws', async () => {
    const repo = makeRepoMock();
    const provider = makeSmsMock();
    provider.send.mockRejectedValue(new Error('SMS gateway error'));
    const useCase = new SendSmsUseCase(repo, provider);

    const result = await useCase.execute({
      recipientId: 'user-123',
      to: '+22901234567',
      message: 'Test',
    });

    expect(result.status).toBe(NotificationStatus.FAILED);
  });
});
