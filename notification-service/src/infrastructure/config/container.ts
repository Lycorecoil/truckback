import { MongoNotificationRepository } from '../repositories/MongoNotificationRepository';
import { MongoTemplateRepository } from '../repositories/MongoTemplateRepository';
import { NodemailerEmailProvider } from '../providers/NodemailerEmailProvider';
import { StubSmsProvider } from '../providers/StubSmsProvider';
import { StubPushProvider } from '../providers/StubPushProvider';
import { SendEmailUseCase } from '../../application/use-cases/SendEmailUseCase';
import { SendSmsUseCase } from '../../application/use-cases/SendSmsUseCase';
import { SendPushUseCase } from '../../application/use-cases/SendPushUseCase';
import { GetUserNotificationsUseCase } from '../../application/use-cases/GetUserNotificationsUseCase';
import { CreateTemplateUseCase } from '../../application/use-cases/CreateTemplateUseCase';

const notificationRepository = new MongoNotificationRepository();
const templateRepository = new MongoTemplateRepository();

const emailProvider = new NodemailerEmailProvider();
const smsProvider = new StubSmsProvider();
const pushProvider = new StubPushProvider();

export const container = {
  sendEmailUseCase: new SendEmailUseCase(notificationRepository, emailProvider),
  sendSmsUseCase: new SendSmsUseCase(notificationRepository, smsProvider),
  sendPushUseCase: new SendPushUseCase(notificationRepository, pushProvider),
  getUserNotificationsUseCase: new GetUserNotificationsUseCase(notificationRepository),
  createTemplateUseCase: new CreateTemplateUseCase(templateRepository),
};

export type Container = typeof container;
