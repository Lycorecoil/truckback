import jwt from 'jsonwebtoken';
import { IJwtService, JwtPayload } from '../../application/ports/IJwtService';

export class JwtService implements IJwtService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '7d',
  ) {}

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }
}
