import { ResetPasswordUseCase } from './ResetPasswordUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { INotificationClient } from '../ports/INotificationClient';
import { User, UserRole } from '../../domain/entities/User';

const makeRepositoryMock = (): jest.Mocked<IUserRepository> => ({
  findById:       jest.fn(),
  findByEmail:    jest.fn(),
  save:           jest.fn(),
  delete:         jest.fn(),
  updatePassword: jest.fn().mockResolvedValue(undefined),
});

const makeJwtMock = (): jest.Mocked<IJwtService> => ({
  sign:          jest.fn().mockReturnValue('fake-jwt-token'),
  signRefresh:   jest.fn().mockReturnValue('fake-refresh-token'),
  signReset:     jest.fn().mockReturnValue('fake-reset-token'),
  verify:        jest.fn(),
  verifyRefresh: jest.fn(),
  verifyReset:   jest.fn().mockReturnValue('user-id-1'),
});

const makeNotificationMock = (): jest.Mocked<INotificationClient> => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  sendSms:   jest.fn().mockResolvedValue(undefined),
});

describe('ResetPasswordUseCase', () => {
  let userRepository:    jest.Mocked<IUserRepository>;
  let jwtService:        jest.Mocked<IJwtService>;
  let notificationClient: jest.Mocked<INotificationClient>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    userRepository     = makeRepositoryMock();
    jwtService         = makeJwtMock();
    notificationClient = makeNotificationMock();
    useCase = new ResetPasswordUseCase(userRepository, jwtService, notificationClient);
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
    expect(jwtService.signReset).toHaveBeenCalledWith(user.id);
    expect(notificationClient.sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String),
      expect.any(String),
      user.id,
    );
  });

  it("devrait résoudre silencieusement si l'email est introuvable (anti-enumeration)", async () => {
    // Le use case ne lève PAS d'erreur pour ne pas révéler l'existence du compte
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'inconnu@example.com' }),
    ).resolves.toBeUndefined();

    expect(notificationClient.sendEmail).not.toHaveBeenCalled();
    expect(jwtService.signReset).not.toHaveBeenCalled();
  });
});
