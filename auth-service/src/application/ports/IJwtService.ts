export interface JwtPayload {
  sub: string;      // userId
  tenantId: string;
  role: string;
  iat?: number;     // issued at (ajouté par jsonwebtoken)
  exp?: number;     // expiry timestamp (secondes UNIX, ajouté par jsonwebtoken)
}

export interface IJwtService {
  sign(payload: JwtPayload): string;
  signRefresh(payload: JwtPayload): string;
  signReset(userId: string): string;
  verify(token: string): JwtPayload;
  verifyRefresh(token: string): JwtPayload;
  verifyReset(token: string): string; // retourne userId
}
