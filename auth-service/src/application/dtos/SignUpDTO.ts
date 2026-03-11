export interface SignUpDTO {
  email: string;
  password: string;
  role: 'COMPANY' | 'TRANSPORTER';
  tenantId: string;
}

export interface SignUpResponseDTO {
  id: string;
  email: string;
  role: string;
  token: string;
}
