import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/config/container';

export class NotificationController {
  constructor(private readonly container: Container) {}

  async sendEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.container.sendEmailUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async sendSms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.container.sendSmsUseCase.execute(req.body);
      res.status(201).json(result);
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
