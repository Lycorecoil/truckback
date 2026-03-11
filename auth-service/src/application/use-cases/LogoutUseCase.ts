export interface LogoutDTO {
  userId: string;
}

export class LogoutUseCase {
  async execute(_dto: LogoutDTO): Promise<void> {
    // JWT is stateless — logout is handled client-side by discarding the token
    return;
  }
}
