import { createHash } from 'crypto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { LoginDTO, LoginResponseDTO } from '../dtos/LoginDTO';
import { Password } from '../../domain/value-objects/Password';
import { InvalidCredentialsError } from '../../domain/errors/DomainError';

const CACHE_TTL_SECONDS = 60;

interface CachedCredentials {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

interface ILoginCache {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<unknown>;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
    private readonly cache?: ILoginCache,
  ) {}

  async execute(dto: LoginDTO): Promise<LoginResponseDTO> {
    // ── Cache hit : skip bcrypt ──────────────────────────────────────────────
    if (this.cache) {
      const cacheKey = this.buildCacheKey(dto.email, dto.password);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        const { userId, email, role, tenantId } = JSON.parse(cached) as CachedCredentials;
        const jwtPayload = { sub: userId, tenantId, role };
        return {
          token:        this.jwtService.sign(jwtPayload),
          refreshToken: this.jwtService.signRefresh(jwtPayload),
          user:         { id: userId, email, role, tenantId },
        };
      }
    }

    // ── Cache miss : vérification complète ──────────────────────────────────
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();

    const password = Password.fromHash(user.password);
    const isValid = await password.verify(dto.password);
    if (!isValid) throw new InvalidCredentialsError();

    // Stocker en cache pour les 60 prochaines secondes
    if (this.cache) {
      const cacheKey = this.buildCacheKey(dto.email, dto.password);
      const payload: CachedCredentials = {
        userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId,
      };
      await this.cache.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(payload));
    }

    const jwtPayload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const token = this.jwtService.sign(jwtPayload);
    const refreshToken = this.jwtService.signRefresh(jwtPayload);

    return {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }

  private buildCacheKey(email: string, password: string): string {
    const hash = createHash('sha256').update(`${email}:${password}`).digest('hex');
    return `auth:pw:${hash}`;
  }
}
