import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { CreateDriverDTO, CreateDriverResponseDTO } from '../dtos/CreateDriverDTO';
import { User, UserRole } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { UserAlreadyExistsError } from '../../domain/errors/DomainError';

export class CreateDriverUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

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

    return { id: saved.id, email: saved.email, role: 'DRIVER' };
  }
}
