export interface CreateDriverDTO {
  email: string;
  password: string;
  tenantId: string;
  transporterId: string; // Le transporteur qui crée le chauffeur
}

export interface CreateDriverResponseDTO {
  id: string;
  email: string;
  role: 'DRIVER';
}
