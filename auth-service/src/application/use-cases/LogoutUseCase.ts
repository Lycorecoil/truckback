import { IJwtService } from '../ports/IJwtService';
import { IRevokedTokenRepository } from '../../domain/repositories/IRevokedTokenRepository';

export interface LogoutDTO {
  refreshToken?: string;
}

export class LogoutUseCase {
  constructor(
    private readonly revokedTokenRepository: IRevokedTokenRepository,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(dto: LogoutDTO): Promise<void> {
    if (!dto.refreshToken) return; // logout sans token = pas d'erreur

    try {
      const payload = this.jwtService.verifyRefresh(dto.refreshToken);
      const expiresAt = payload.exp
        ? new Date(payload.exp * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback 30j
      await this.revokedTokenRepository.revoke(dto.refreshToken, expiresAt);
    } catch {
      // Token déjà expiré ou invalide — révocation inutile, pas d'erreur
    }
  }
}
