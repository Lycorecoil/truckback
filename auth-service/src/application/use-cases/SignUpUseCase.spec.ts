import { SignUpUseCase } from './SignUpUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { User, UserRole } from '../../domain/entities/User';
import { UserAlreadyExistsError } from '../../domain/errors/DomainError';

const makeUser = (): User =>
  new User({
    tenantId: 'tenant-1',
    email: 'test@example.com',
    password: 'hashed',
    role: UserRole.COMPANY,
  });

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

describe('SignUpUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<IJwtService>;
  let useCase: SignUpUseCase;

  beforeEach(() => {
    userRepository = makeRepositoryMock();
    jwtService = makeJwtMock();
    useCase = new SignUpUseCase(userRepository, jwtService);
  });

  it('devrait créer un utilisateur et retourner un token', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    const savedUser = makeUser();
    userRepository.save.mockResolvedValue(savedUser);

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
      role: 'COMPANY',
      tenantId: 'tenant-1',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledTimes(1);
    expect(result.token).toBe('fake-jwt-token');
    expect(result.email).toBe('test@example.com');
    expect(result.role).toBe(UserRole.COMPANY);
  });

  it("devrait lever UserAlreadyExistsError si l'email existe déjà", async () => {
    userRepository.findByEmail.mockResolvedValue(makeUser());

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'password123',
        role: 'COMPANY',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(UserAlreadyExistsError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('devrait lever une erreur si le mot de passe est trop court', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: '123',
        role: 'COMPANY',
        tenantId: 'tenant-1',
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
        role: 'COMPANY',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow();
  });
});
