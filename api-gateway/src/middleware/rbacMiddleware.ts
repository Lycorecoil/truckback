import { Request, Response, NextFunction } from 'express';

type Role = 'ADMIN' | 'EXPEDITEUR' | 'TRANSPORTER' | 'DRIVER';

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.headers['x-user-role'] as string | undefined;
    if (!role || !roles.includes(role as Role)) {
      res.status(403).json({
        error: `Accès refusé. Rôle requis : ${roles.join(' ou ')}. Rôle actuel : ${role ?? 'inconnu'}`,
      });
      return;
    }
    next();
  };
}
