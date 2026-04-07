import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';
import { UserNotFoundError } from '../../domain/errors/DomainError';
import { Email } from '../../domain/value-objects/Email';

export interface UpdateUserDTO {
  email?: string;
  role?: UserRole;
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: UpdateUserDTO) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const updated = new User({
      id: user.id,
      tenantId: user.tenantId,
      email: dto.email ? new Email(dto.email).toString() : user.email,
      password: user.password,
      role: dto.role ?? user.role,
      createdAt: user.createdAt,
    });

    const saved = await this.userRepository.save(updated);

    return {
      id: saved.id,
      email: saved.email,
      role: saved.role,
      tenantId: saved.tenantId,
      createdAt: saved.createdAt,
    };
  }
}
