import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserNotFoundError } from '../../domain/errors/DomainError';
import { Password } from '../../domain/value-objects/Password';

export class ResetUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const password = await Password.fromPlainText(newPassword);
    await this.userRepository.updatePassword(userId, password.toString());
  }
}
