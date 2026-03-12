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
}
