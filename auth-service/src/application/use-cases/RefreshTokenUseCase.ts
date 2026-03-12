import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { UnauthorizedError } from '../../domain/errors/DomainError';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(dto: { refreshToken: string }): Promise<{ accessToken: string }> {
    let payload: ReturnType<typeof this.jwtService.verifyRefresh>;
    try {
      payload = this.jwtService.verifyRefresh(dto.refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token invalide ou expiré.');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedError('Utilisateur introuvable.');

    const accessToken = this.jwtService.sign({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    return { accessToken };
  }
}
