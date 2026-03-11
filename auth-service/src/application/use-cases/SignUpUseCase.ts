import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { SignUpDTO, SignUpResponseDTO } from '../dtos/SignUpDTO';
import { User, UserRole } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { UserAlreadyExistsError } from '../../domain/errors/DomainError';

export class SignUpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(dto: SignUpDTO): Promise<SignUpResponseDTO> {
    const email = new Email(dto.email);

    const existing = await this.userRepository.findByEmail(email.toString());
    if (existing) {
      throw new UserAlreadyExistsError(email.toString());
    }

    const password = await Password.fromPlainText(dto.password);

    const user = new User({
      tenantId: dto.tenantId,
      email: email.toString(),
      password: password.toString(),
      role: dto.role as UserRole,
    });

    const saved = await this.userRepository.save(user);

    const token = this.jwtService.sign({
      sub: saved.id,
      tenantId: saved.tenantId,
      role: saved.role,
    });

    return {
      id: saved.id,
      email: saved.email,
      role: saved.role,
      token,
    };
  }
}
