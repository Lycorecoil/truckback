import { CreateTemplateUseCase } from './CreateTemplateUseCase';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { NotificationTemplate } from '../../domain/entities/NotificationTemplate';
import { NotificationChannel } from '../../domain/entities/Notification';
import { TemplateAlreadyExistsError } from '../../domain/errors/NotificationError';

const makeRepoMock = (): jest.Mocked<ITemplateRepository> => ({
  findByName: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockImplementation((t: NotificationTemplate) => Promise.resolve(t)),
});

describe('CreateTemplateUseCase', () => {
  it('should create a template and return it', async () => {
    const repo = makeRepoMock();
    const useCase = new CreateTemplateUseCase(repo);

    const result = await useCase.execute({
      name: 'welcome-email',
      channel: NotificationChannel.EMAIL,
      subject: 'Bienvenue sur Camion Uber',
      body: 'Bonjour {{name}}, votre compte a été créé.',
    });

    expect(repo.save).toHaveBeenCalled();
    expect(result.name).toBe('welcome-email');
    expect(result.channel).toBe(NotificationChannel.EMAIL);
    expect(result.subject).toBe('Bienvenue sur Camion Uber');
  });

  it('should throw TemplateAlreadyExistsError if name already exists', async () => {
    const repo = makeRepoMock();
    const existing = new NotificationTemplate({
      name: 'welcome-email',
      channel: NotificationChannel.EMAIL,
      body: 'existing body',
    });
    repo.findByName.mockResolvedValue(existing);
    const useCase = new CreateTemplateUseCase(repo);

    await expect(
      useCase.execute({ name: 'welcome-email', channel: NotificationChannel.EMAIL, body: 'autre body' }),
    ).rejects.toThrow(TemplateAlreadyExistsError);
  });
});
