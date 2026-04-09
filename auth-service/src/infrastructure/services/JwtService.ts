import jwt from 'jsonwebtoken';
import { IJwtService, JwtPayload } from '../../application/ports/IJwtService';

/**
 * JwtService — RS256 pour les access tokens, HS256 pour refresh et reset.
 *
 * Access tokens : signés avec la clé privée RSA (PKCS#8 PEM), vérifiables
 * par l'api-gateway avec la clé publique uniquement (pas de secret partagé).
 *
 * Refresh / reset tokens : HS256 avec un secret symétrique distinct,
 * jamais exposés à l'extérieur de l'auth-service.
 */
export class JwtService implements IJwtService {
  private readonly refreshSecret: string;

  constructor(
    private readonly privateKey: string,
    private readonly publicKey: string,
    private readonly expiresIn: string = '1h',
  ) {
    this.refreshSecret = process.env['JWT_REFRESH_SECRET'] ?? 'refresh_secret_change_me';
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.expiresIn,
    } as jwt.SignOptions);
  }

  signRefresh(payload: JwtPayload): string {
    const expiresIn = payload.role === 'DRIVER' ? '1y' : '30d';
    return jwt.sign(payload, this.refreshSecret, { expiresIn } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] }) as JwtPayload;
  }

  verifyRefresh(token: string): JwtPayload {
    return jwt.verify(token, this.refreshSecret) as JwtPayload;
  }

  signReset(userId: string): string {
    const resetSecret = `${this.refreshSecret}_reset`;
    return jwt.sign({ sub: userId, purpose: 'password-reset' }, resetSecret, { expiresIn: '15m' } as jwt.SignOptions);
  }

  verifyReset(token: string): string {
    const resetSecret = `${this.refreshSecret}_reset`;
    const payload = jwt.verify(token, resetSecret) as { sub: string; purpose: string };
    if (payload.purpose !== 'password-reset') throw new Error('Token invalide');
    return payload.sub;
  }
}
