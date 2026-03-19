import { LoginUseCase } from './LoginUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { User, UserRole } from '../../domain/entities/User';
import { InvalidCredentialsError } from '../../domain/errors/DomainError';
import bcrypt from 'bcrypt';

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

describe('LoginUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<IJwtService>;
  let useCase: LoginUseCase;
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash('password123', 12);
  });

  beforeEach(() => {
    userRepository = makeRepositoryMock();
    jwtService = makeJwtMock();
    useCase = new LoginUseCase(userRepository, jwtService);
  });

  it('devrait retourner un token et les infos user si credentials valides', async () => {
    const user = new User({
      tenantId: 'tenant-1',
      email: 'test@example.com',
      password: validPasswordHash,
      role: UserRole.EXPEDITEUR,
    });
    userRepository.findByEmail.mockResolvedValue(user);

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.token).toBe('fake-jwt-token');
    expect(result.refreshToken).toBe('fake-refresh-token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.role).toBe(UserRole.EXPEDITEUR);
    expect(result.user.tenantId).toBe('tenant-1');
  });

  it("devrait lever InvalidCredentialsError si l'email est introuvable", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'inconnu@example.com', password: 'password123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('devrait lever InvalidCredentialsError si le mot de passe est incorrect', async () => {
    const user = new User({
      tenantId: 'tenant-1',
      email: 'test@example.com',
      password: validPasswordHash,
      role: UserRole.EXPEDITEUR,
    });
    userRepository.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'mauvais-mdp' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
