import { MongoUserRepository } from '../repositories/MongoUserRepository';
import { MongoRevokedTokenRepository } from '../repositories/MongoRevokedTokenRepository';
import { NotificationClient } from '../clients/NotificationClient';
import { JwtService } from '../services/JwtService';
import { SignUpUseCase } from '../../application/use-cases/SignUpUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { CreateDriverUseCase } from '../../application/use-cases/CreateDriverUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { ConfirmResetPasswordUseCase } from '../../application/use-cases/ConfirmResetPasswordUseCase';

const userRepository         = new MongoUserRepository();
const revokedTokenRepository = new MongoRevokedTokenRepository();
const notificationClient     = new NotificationClient();

const jwtSecret = process.env['JWT_SECRET'];
if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');

const jwtService = new JwtService(
  jwtSecret,
  process.env['JWT_EXPIRES_IN'] ?? '1h',
);

export const container = {
  signUpUseCase:      new SignUpUseCase(userRepository, jwtService),
  loginUseCase:       new LoginUseCase(userRepository, jwtService),
  createDriverUseCase: new CreateDriverUseCase(userRepository, notificationClient),
  logoutUseCase:      new LogoutUseCase(revokedTokenRepository, jwtService),
  resetPasswordUseCase: new ResetPasswordUseCase(userRepository, jwtService, notificationClient),
  confirmResetPasswordUseCase: new ConfirmResetPasswordUseCase(userRepository, jwtService, revokedTokenRepository),
  refreshTokenUseCase: new RefreshTokenUseCase(userRepository, jwtService, revokedTokenRepository),
};

export type Container = typeof container;
