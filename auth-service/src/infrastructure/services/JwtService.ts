import jwt from 'jsonwebtoken';
import { IJwtService, JwtPayload } from '../../application/ports/IJwtService';

export class JwtService implements IJwtService {
  private readonly refreshSecret: string;

  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '1h',
  ) {
    this.refreshSecret = process.env['JWT_REFRESH_SECRET'] ?? `${secret}_refresh`;
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  signRefresh(payload: JwtPayload): string {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: '30d' } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }

  verifyRefresh(token: string): JwtPayload {
    return jwt.verify(token, this.refreshSecret) as JwtPayload;
  }

  signReset(userId: string): string {
    const resetSecret = `${this.secret}_reset`;
    return jwt.sign({ sub: userId, purpose: 'password-reset' }, resetSecret, { expiresIn: '15m' } as jwt.SignOptions);
  }

  verifyReset(token: string): string {
    const resetSecret = `${this.secret}_reset`;
    const payload = jwt.verify(token, resetSecret) as { sub: string; purpose: string };
    if (payload.purpose !== 'password-reset') throw new Error('Token invalide');
    return payload.sub;
  }
}
