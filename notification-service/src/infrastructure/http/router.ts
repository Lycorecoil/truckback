import { Router } from 'express';
import { NotificationController } from './controllers/NotificationController';
import { container } from '../config/container';
import { validateBody } from '../../utils/validate';
import { SendEmailSchema, SendSmsSchema } from './schemas';

const controller = new NotificationController(container);

export const notificationRouter = Router();

notificationRouter.post('/notification/email',    validateBody(SendEmailSchema), (req, res, next) => controller.sendEmail(req, res, next));
notificationRouter.post('/notification/sms',      validateBody(SendSmsSchema),   (req, res, next) => controller.sendSms(req, res, next));
notificationRouter.post('/notification/push',     (req, res, next) => controller.sendPush(req, res, next));
notificationRouter.get('/notification/:userId',   (req, res, next) => controller.getUserNotifications(req, res, next));
notificationRouter.post('/notification/template', (req, res, next) => controller.createTemplate(req, res, next));
