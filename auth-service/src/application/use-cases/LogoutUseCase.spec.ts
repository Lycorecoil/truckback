import { LogoutUseCase } from './LogoutUseCase';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;

  beforeEach(() => {
    useCase = new LogoutUseCase();
  });

  it('devrait résoudre sans erreur (JWT stateless, no-op)', async () => {
    await expect(useCase.execute({ userId: 'user-1' })).resolves.toBeUndefined();
  });
});
