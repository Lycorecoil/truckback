import { MongoUserRepository } from '../repositories/MongoUserRepository';
import { NotificationClient } from '../clients/NotificationClient';
import { JwtService } from '../services/JwtService';
import { SignUpUseCase } from '../../application/use-cases/SignUpUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { CreateDriverUseCase } from '../../application/use-cases/CreateDriverUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';

// Composition root — câble les dépendances manuellement
// Pas de framework DI : l'injection se fait par constructeur

const userRepository = new MongoUserRepository();
const notificationClient = new NotificationClient();

const jwtSecret = process.env['JWT_SECRET'];
if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');

const jwtService = new JwtService(
  jwtSecret,
  process.env['JWT_EXPIRES_IN'] ?? '7d',
);

export const container = {
  signUpUseCase: new SignUpUseCase(userRepository, jwtService),
  loginUseCase: new LoginUseCase(userRepository, jwtService),
  createDriverUseCase: new CreateDriverUseCase(userRepository),
  logoutUseCase: new LogoutUseCase(),
  resetPasswordUseCase: new ResetPasswordUseCase(userRepository, notificationClient),
};

export type Container = typeof container;
