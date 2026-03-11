import { CreateDriverUseCase } from './CreateDriverUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';
import { UserAlreadyExistsError } from '../../domain/errors/DomainError';

const makeRepositoryMock = (): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('CreateDriverUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: CreateDriverUseCase;

  beforeEach(() => {
    userRepository = makeRepositoryMock();
    useCase = new CreateDriverUseCase(userRepository);
  });

  it('devrait créer un chauffeur et retourner ses infos', async () => {
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
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('driver@example.com');
    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(result.email).toBe('driver@example.com');
    expect(result.role).toBe('DRIVER');
    expect(result.id).toBeDefined();
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
