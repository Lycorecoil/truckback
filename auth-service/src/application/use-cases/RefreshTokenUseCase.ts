import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { IRevokedTokenRepository } from '../../domain/repositories/IRevokedTokenRepository';
import { UnauthorizedError } from '../../domain/errors/DomainError';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
    private readonly revokedTokenRepository: IRevokedTokenRepository,
  ) {}

  async execute(dto: { refreshToken: string }): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Vérification cryptographique
    let payload: ReturnType<typeof this.jwtService.verifyRefresh>;
    try {
      payload = this.jwtService.verifyRefresh(dto.refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token invalide ou expiré.');
    }

    // 2. Vérification blacklist (token révoqué par logout ou rotation précédente)
    if (await this.revokedTokenRepository.isRevoked(dto.refreshToken)) {
      throw new UnauthorizedError('Refresh token révoqué.');
    }

    // 3. Vérification utilisateur toujours actif
    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedError('Utilisateur introuvable.');

    // 4. Rotation : révoque l'ancien refresh token
    const fallbackMs = payload.role === 'DRIVER'
      ? 365 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    const expiresAt = payload.exp
      ? new Date(payload.exp * 1000)
      : new Date(Date.now() + fallbackMs);
    await this.revokedTokenRepository.revoke(dto.refreshToken, expiresAt);

    // 5. Émet un nouveau pair de tokens
    const jwtPayload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const accessToken  = this.jwtService.sign(jwtPayload);
    const refreshToken = this.jwtService.signRefresh(jwtPayload);

    return { accessToken, refreshToken };
  }
}
