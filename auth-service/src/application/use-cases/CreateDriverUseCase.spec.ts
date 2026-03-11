import { CreateDriverUseCase } from './CreateDriverUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { INotificationClient } from '../ports/INotificationClient';
import { User, UserRole } from '../../domain/entities/User';
import { UserAlreadyExistsError } from '../../domain/errors/DomainError';

const makeRepositoryMock = (): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const makeNotificationMock = (): jest.Mocked<INotificationClient> => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  sendSms: jest.fn().mockResolvedValue(undefined),
});

describe('CreateDriverUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let notificationClient: jest.Mocked<INotificationClient>;
  let useCase: CreateDriverUseCase;

  beforeEach(() => {
    userRepository = makeRepositoryMock();
    notificationClient = makeNotificationMock();
    useCase = new CreateDriverUseCase(userRepository, notificationClient);
  });

  it('devrait créer un chauffeur et envoyer email + SMS de bienvenue', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    const savedUser = new User({
      tenantId: 'tenant-1',
      email: 'driver@example.com',
      password: 'hashed',
      role: UserRole.DRIVER,
    });
    userRepository.save.mockResolvedValue(savedUser);

    const result = await useCase.execute({
      email: 'driver@example.com',
      password: 'password123',
      tenantId: 'tenant-1',
      transporterId: 'transporter-1',
      telephone: '+237600000001',
    });

    expect(result.email).toBe('driver@example.com');
    expect(result.role).toBe('DRIVER');
    // Laisser les void promises se résoudre
    await new Promise((r) => setTimeout(r, 50));
    expect(notificationClient.sendEmail).toHaveBeenCalledWith(
      'driver@example.com',
      expect.stringContaining('chauffeur'),
      expect.stringContaining('password123'),
      savedUser.id,
    );
    expect(notificationClient.sendSms).toHaveBeenCalledWith(
      '+237600000001',
      expect.stringContaining('password123'),
      savedUser.id,
    );
  });

  it('devrait créer un chauffeur sans SMS si telephone absent', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    const savedUser = new User({
      tenantId: 'tenant-1',
      email: 'driver@example.com',
      password: 'hashed',
      role: UserRole.DRIVER,
    });
    userRepository.save.mockResolvedValue(savedUser);

    await useCase.execute({
      email: 'driver@example.com',
      password: 'password123',
      tenantId: 'tenant-1',
      transporterId: 'transporter-1',
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(notificationClient.sendEmail).toHaveBeenCalledTimes(1);
    expect(notificationClient.sendSms).not.toHaveBeenCalled();
  });

  it("devrait lever UserAlreadyExistsError si l'email existe déjà", async () => {
    const existing = new User({
      tenantId: 'tenant-1',
      email: 'driver@example.com',
      password: 'hashed',
      role: UserRole.DRIVER,
    });
    userRepository.findByEmail.mockResolvedValue(existing);

    await expect(
      useCase.execute({
        email: 'driver@example.com',
        password: 'password123',
        tenantId: 'tenant-1',
        transporterId: 'transporter-1',
      }),
    ).rejects.toThrow(UserAlreadyExistsError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('devrait lever une erreur si le mot de passe est trop court', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'driver@example.com',
        password: '123',
        tenantId: 'tenant-1',
        transporterId: 'transporter-1',
      }),
    ).rejects.toThrow();

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("devrait lever une erreur si le format d'email est invalide", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'email-invalide',
        password: 'password123',
        tenantId: 'tenant-1',
        transporterId: 'transporter-1',
      }),
    ).rejects.toThrow();
  });
});
