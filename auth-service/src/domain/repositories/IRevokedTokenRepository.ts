export interface IRevokedTokenRepository {
  /** Marque un refresh token comme révoqué jusqu'à sa date d'expiration. */
  revoke(token: string, expiresAt: Date): Promise<void>;
  /** Retourne true si le token a été révoqué (logout ou rotation). */
  isRevoked(token: string): Promise<boolean>;
}
