import { Request, Response, NextFunction } from 'express';
import { Container } from '../../config/container';

export class AuthController {
  constructor(private readonly container: Container) {}

  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.container.signUpUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.container.loginUseCase.execute(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.container.createDriverUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.container.logoutUseCase.execute(req.body);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.container.resetPasswordUseCase.execute(req.body);
      res.status(200).json({ message: 'Email de réinitialisation envoyé.' });
    } catch (err) {
      next(err);
    }
  }
}
