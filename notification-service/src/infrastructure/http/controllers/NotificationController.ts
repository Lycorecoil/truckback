import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/config/container';
import { emailQueue, smsQueue } from '../../queue/notificationQueue';

export class NotificationController {
  constructor(private readonly container: Container) {}

  async sendEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await emailQueue.add('send', req.body);
      res.status(202).json({ message: 'Email en file d\'attente' });
    } catch (err) {
      next(err);
    }
  }

  async sendSms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await smsQueue.add('send', req.body);
      res.status(202).json({ message: 'SMS en file d\'attente' });
    } catch (err) {
      next(err);
    }
  }

  async sendPush(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.container.sendPushUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.container.getUserNotificationsUseCase.execute({ userId: req.params["userId"] as string });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.container.createTemplateUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}
