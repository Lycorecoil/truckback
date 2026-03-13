import { Request, Response, NextFunction } from 'express';
import { Container } from '../../config/container';
import type { SignUpDTO } from '../../../application/dtos/SignUpDTO';
import type { LoginDTO } from '../../../application/dtos/LoginDTO';
import type { CreateDriverDTO } from '../../../application/dtos/CreateDriverDTO';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBody(
  body: Record<string, unknown>,
  rules: Record<string, (v: unknown) => string | null>,
): string[] {
  return Object.entries(rules)
    .map(([field, check]) => check(body[field]))
    .filter((msg): msg is string => msg !== null);
}

export class AuthController {
  constructor(private readonly container: Container) {}

  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const errors = validateBody(body, {
        email: (v) => (!v || !EMAIL_REGEX.test(String(v)) ? 'email invalide' : null),
        password: (v) => (!v || String(v).length < 6 ? 'password doit faire au moins 6 caractères' : null),
        tenantId: (v) => (!v ? 'tenantId est requis' : null),
        role: (v) => {
          const valid = ['ADMIN', 'COMPANY', 'TRANSPORTER', 'DRIVER'];
          return !v || !valid.includes(String(v)) ? `role doit être parmi : ${valid.join(', ')}` : null;
        },
      });
      if (errors.length > 0) {
        res.status(400).json({ error: errors.join('; ') });
        return;
      }
      const result = await this.container.signUpUseCase.execute((body as unknown) as SignUpDTO);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const errors = validateBody(body, {
        email: (v) => (!v || !EMAIL_REGEX.test(String(v)) ? 'email invalide' : null),
        password: (v) => (!v ? 'password est requis' : null),
      });
      if (errors.length > 0) {
        res.status(400).json({ error: errors.join('; ') });
        return;
      }
      const result = await this.container.loginUseCase.execute((body as unknown) as LoginDTO);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const errors = validateBody(body, {
        email: (v) => (!v || !EMAIL_REGEX.test(String(v)) ? 'email invalide' : null),
        password: (v) => (!v || String(v).length < 6 ? 'password doit faire au moins 6 caractères' : null),
        tenantId: (v) => (!v ? 'tenantId est requis' : null),
        transporterId: (v) => (!v ? 'transporterId est requis' : null),
      });
      if (errors.length > 0) {
        res.status(400).json({ error: errors.join('; ') });
        return;
      }
      const result = await this.container.createDriverUseCase.execute((body as unknown) as CreateDriverDTO);
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

  async confirmResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as { token?: string; newPassword?: string };
      if (!body.token || !body.newPassword) {
        res.status(400).json({ error: 'token et newPassword sont requis' });
        return;
      }
      await this.container.confirmResetPasswordUseCase.execute(body as { token: string; newPassword: string });
      res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as { refreshToken?: string };
      if (!body.refreshToken) {
        res.status(400).json({ error: 'refreshToken est requis' });
        return;
      }
      const result = await this.container.refreshTokenUseCase.execute({ refreshToken: body.refreshToken });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
