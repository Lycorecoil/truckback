export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}
