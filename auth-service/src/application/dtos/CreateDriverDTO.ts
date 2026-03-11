export interface CreateDriverDTO {
  email: string;
  password: string;
  tenantId: string;
  transporterId: string; // Le transporteur qui crée le chauffeur
  telephone?: string;    // Optionnel — pour envoyer le SMS de bienvenue
}

export interface CreateDriverResponseDTO {
  id: string;
  email: string;
  role: 'DRIVER';
}
