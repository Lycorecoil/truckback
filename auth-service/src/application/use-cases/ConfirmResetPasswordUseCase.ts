import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { IRevokedTokenRepository } from '../../domain/repositories/IRevokedTokenRepository';
import { Password } from '../../domain/value-objects/Password';
import { UnauthorizedError } from '../../domain/errors/DomainError';

export interface ConfirmResetPasswordDTO {
  token: string;
  newPassword: string;
}

export class ConfirmResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
    private readonly revokedTokenRepository: IRevokedTokenRepository,
  ) {}

  async execute(dto: ConfirmResetPasswordDTO): Promise<void> {
    // 1. Vérifie la signature et l'expiration (15min)
    let userId: string;
    try {
      userId = this.jwtService.verifyReset(dto.token);
    } catch {
      throw new UnauthorizedError('Token de réinitialisation invalide ou expiré.');
    }

    // 2. Vérifie que le token n'a pas déjà été utilisé (usage unique)
    if (await this.revokedTokenRepository.isRevoked(dto.token)) {
      throw new UnauthorizedError('Ce lien a déjà été utilisé.');
    }

    // 3. Vérifie que l'utilisateur existe toujours
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError('Utilisateur introuvable.');

    // 4. Hash le nouveau mot de passe
    const password = await Password.fromPlainText(dto.newPassword);

    // 5. Met à jour le mot de passe
    await this.userRepository.updatePassword(userId, password.toString());

    // 6. Invalide le token (usage unique) — TTL = 15min (durée originale du token)
    await this.revokedTokenRepository.revoke(dto.token, new Date(Date.now() + 15 * 60 * 1000));
  }
}
