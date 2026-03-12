export interface JwtPayload {
  sub: string;     // userId
  tenantId: string;
  role: string;
}

export interface IJwtService {
  sign(payload: JwtPayload): string;
  signRefresh(payload: JwtPayload): string;
  verify(token: string): JwtPayload;
  verifyRefresh(token: string): JwtPayload;
}
