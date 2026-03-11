import { ResetPasswordUseCase } from './ResetPasswordUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { INotificationClient } from '../ports/INotificationClient';
import { User, UserRole } from '../../domain/entities/User';
import { UserNotFoundError } from '../../domain/errors/DomainError';

const makeRepositoryMock = (): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const makeNotificationMock = (): jest.Mocked<INotificationClient> => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
});

describe('ResetPasswordUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let notificationClient: jest.Mocked<INotificationClient>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    userRepository = makeRepositoryMock();
    notificationClient = makeNotificationMock();
    useCase = new ResetPasswordUseCase(userRepository, notificationClient);
  });

  it("devrait envoyer un email de réinitialisation si l'utilisateur existe", async () => {
    const user = new User({
      tenantId: 'tenant-1',
      email: 'test@example.com',
      password: 'hashed',
      role: UserRole.COMPANY,
    });
    userRepository.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: 'test@example.com' }),
    ).resolves.toBeUndefined();

    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(notificationClient.sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String),
      expect.any(String),
      user.id,
    );
  });

  it("devrait lever UserNotFoundError si l'email est introuvable", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'inconnu@example.com' }),
    ).rejects.toThrow(UserNotFoundError);

    expect(notificationClient.sendEmail).not.toHaveBeenCalled();
  });
});
