import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJwtService } from '../ports/IJwtService';
import { LoginDTO, LoginResponseDTO } from '../dtos/LoginDTO';
import { Password } from '../../domain/value-objects/Password';
import { InvalidCredentialsError } from '../../domain/errors/DomainError';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(dto: LoginDTO): Promise<LoginResponseDTO> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();

    const password = Password.fromHash(user.password);
    const isValid = await password.verify(dto.password);
    if (!isValid) throw new InvalidCredentialsError();

    const jwtPayload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const token = this.jwtService.sign(jwtPayload);
    const refreshToken = this.jwtService.signRefresh(jwtPayload);

    return {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }
}
