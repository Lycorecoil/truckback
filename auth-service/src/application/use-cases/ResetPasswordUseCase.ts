import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { INotificationClient } from '../ports/INotificationClient';
import { UserNotFoundError } from '../../domain/errors/DomainError';

export interface ResetPasswordDTO {
  email: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly notificationClient: INotificationClient,
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new UserNotFoundError(dto.email);

    await this.notificationClient.sendEmail(
      user.email,
      'Réinitialisation de votre mot de passe',
      `Bonjour,\n\nUne demande de réinitialisation de mot de passe a été effectuée pour votre compte.\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\nÉquipe Camion Uber`,
      user.id,
    );
  }
}
