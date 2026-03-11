import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { INotificationClient } from '../ports/INotificationClient';
import { CreateDriverDTO, CreateDriverResponseDTO } from '../dtos/CreateDriverDTO';
import { User, UserRole } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { UserAlreadyExistsError } from '../../domain/errors/DomainError';

const APP_DOWNLOAD_LINK = process.env['APP_DOWNLOAD_LINK'] ?? 'https://camion-uber.app/download';

export class CreateDriverUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly notificationClient: INotificationClient,
  ) {}

  async execute(dto: CreateDriverDTO): Promise<CreateDriverResponseDTO> {
    const email = new Email(dto.email);
    const existing = await this.userRepository.findByEmail(email.toString());
    if (existing) throw new UserAlreadyExistsError(email.toString());

    const password = await Password.fromPlainText(dto.password);
    const user = new User({
      tenantId: dto.tenantId,
      email: email.toString(),
      password: password.toString(),
      role: UserRole.DRIVER,
    });
    const saved = await this.userRepository.save(user);

    // Notifier le chauffeur par email + SMS avec ses identifiants
    void this.notifyDriver(saved.id, dto.email, dto.password, dto.telephone);

    return { id: saved.id, email: saved.email, role: 'DRIVER' };
  }

  private async notifyDriver(
    driverId: string,
    email: string,
    plainPassword: string,
    telephone?: string,
  ): Promise<void> {
    const emailBody = [
      `Bonjour,`,
      ``,
      `Votre compte chauffeur Camion Uber a été créé par votre transporteur.`,
      ``,
      `Vos identifiants de connexion :`,
      `  Email    : ${email}`,
      `  Mot de passe : ${plainPassword}`,
      ``,
      `Téléchargez l'application ici :`,
      `  ${APP_DOWNLOAD_LINK}`,
      ``,
      `Vous pourrez modifier votre mot de passe depuis l'application.`,
      ``,
      `Équipe Camion Uber`,
    ].join('\n');

    try {
      await this.notificationClient.sendEmail(
        email,
        'Votre compte chauffeur Camion Uber',
        emailBody,
        driverId,
      );
    } catch (err) {
      console.error('[CreateDriver] Erreur envoi email :', err);
    }

    if (telephone) {
      const smsMessage = `Camion Uber: Compte créé. Email: ${email} | MDP: ${plainPassword} | App: ${APP_DOWNLOAD_LINK}`;
      try {
        await this.notificationClient.sendSms(telephone, smsMessage, driverId);
      } catch (err) {
        console.error('[CreateDriver] Erreur envoi SMS :', err);
      }
    }
  }
}
