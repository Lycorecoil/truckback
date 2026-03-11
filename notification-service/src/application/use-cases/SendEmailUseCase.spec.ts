import { SendEmailUseCase } from './SendEmailUseCase';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IEmailProvider } from '../ports/IEmailProvider';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';

const makeRepoMock = (): jest.Mocked<INotificationRepository> => ({
  save: jest.fn().mockImplementation((n: Notification) => Promise.resolve(n)),
  findByRecipientId: jest.fn(),
});

const makeEmailMock = (): jest.Mocked<IEmailProvider> => ({
  send: jest.fn().mockResolvedValue(undefined),
});

describe('SendEmailUseCase', () => {
  it('should send an email and return status SENT', async () => {
    const repo = makeRepoMock();
    const provider = makeEmailMock();
    const useCase = new SendEmailUseCase(repo, provider);

    const result = await useCase.execute({
      recipientId: 'user-123',
      to: 'user@test.fr',
      subject: 'Bienvenue',
      body: 'Votre compte a été créé.',
    });

    expect(provider.send).toHaveBeenCalledWith({
      to: 'user@test.fr',
      subject: 'Bienvenue',
      body: 'Votre compte a été créé.',
    });
    expect(repo.save).toHaveBeenCalled();
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(result.channel).toBe(NotificationChannel.EMAIL);
    expect(result.recipientId).toBe('user-123');
  });

  it('should save notification with status FAILED when provider throws', async () => {
    const repo = makeRepoMock();
    const provider = makeEmailMock();
    provider.send.mockRejectedValue(new Error('SMTP error'));
    const useCase = new SendEmailUseCase(repo, provider);

    const result = await useCase.execute({
      recipientId: 'user-123',
      to: 'user@test.fr',
      subject: 'Bienvenue',
      body: 'Votre compte a été créé.',
    });

    expect(result.status).toBe(NotificationStatus.FAILED);
    expect(repo.save).toHaveBeenCalled();
  });
});
