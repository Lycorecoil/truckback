import { Request, Response, NextFunction } from 'express';
import { Container } from '../../config/container';
import type { SignUpDTO } from '../../../application/dtos/SignUpDTO';
import type { LoginDTO } from '../../../application/dtos/LoginDTO';
import type { CreateDriverDTO } from '../../../application/dtos/CreateDriverDTO';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware';

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
          const valid = ['ADMIN', 'EXPEDITEUR', 'TRANSPORTER', 'DRIVER'];
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

  async createDriver(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'TRANSPORTER' && req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Seul un TRANSPORTER ou ADMIN peut créer un driver.' });
        return;
      }
      const body = req.body as Record<string, unknown>;
      const errors = validateBody(body, {
        email:        (v) => (!v || !EMAIL_REGEX.test(String(v)) ? 'email invalide' : null),
        password:     (v) => (!v || String(v).length < 8 ? 'password doit faire au moins 8 caractères' : null),
        tenantId:     (v) => (!v ? 'tenantId est requis' : null),
        telephone:    (v) => (!v ? 'telephone est requis' : null),
        nom:          (v) => (!v ? 'nom est requis' : null),
        prenom:       (v) => (!v ? 'prenom est requis' : null),
        numeroPermis: (v) => (!v ? 'numeroPermis est requis' : null),
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

  // ── User Management (ADMIN only) ─────────────────────────────────────

  async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
        return;
      }
      const query = req.query as Record<string, string | undefined>;
      const result = await this.container.listUsersUseCase.execute({
        role: query.role as any,
        tenantId: query.tenantId,
        search: query.search,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
        return;
      }
      const userId = req.params['id'] as string;
      const result = await this.container.getUserUseCase.execute(userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
        return;
      }
      const userId = req.params['id'] as string;
      const body = req.body as { email?: string; role?: string };
      const result = await this.container.updateUserUseCase.execute(userId, {
        email: body.email,
        role: body.role as any,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
        return;
      }
      const userId = req.params['id'] as string;
      await this.container.deleteUserUseCase.execute(userId);
      res.status(200).json({ success: true, message: 'Utilisateur supprimé.' });
    } catch (err) {
      next(err);
    }
  }

  async resetUserPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
        return;
      }
      const userId = req.params['id'] as string;
      const body = req.body as { newPassword?: string };
      if (!body.newPassword || body.newPassword.length < 8) {
        res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères.' });
        return;
      }
      await this.container.resetUserPasswordUseCase.execute(userId, body.newPassword);
      res.status(200).json({ success: true, message: 'Mot de passe réinitialisé.' });
    } catch (err) {
      next(err);
    }
  }
}
