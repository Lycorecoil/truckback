import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { INotificationClient } from '../ports/INotificationClient';
import { UserNotFoundError } from '../../domain/errors/DomainError';

export interface ResetPasswordDTO {
  email: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
    private readonly notificationClient: INotificationClient,
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);
    // On ne révèle pas si l'email existe (protection anti-enumeration)
    if (!user) return;

    const resetToken = this.jwtService.signReset(user.id);
    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password/confirm?token=${resetToken}`;

    await this.notificationClient.sendEmail(
      user.email,
      'Réinitialisation de votre mot de passe',
      `Bonjour,\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valable 15 minutes) :\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\nÉquipe Camion Uber`,
      user.id,
    );
  }
}
