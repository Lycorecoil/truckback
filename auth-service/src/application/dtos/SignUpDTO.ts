export interface SignUpDTO {
  email: string;
  password: string;
  role: 'EXPEDITEUR' | 'TRANSPORTER';
  tenantId: string;
}

export interface SignUpResponseDTO {
  id: string;
  email: string;
  role: string;
  token: string;
}
