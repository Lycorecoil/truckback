import { LogoutUseCase } from './LogoutUseCase';
import type { IRevokedTokenRepository } from '../../domain/repositories/IRevokedTokenRepository';
import type { IJwtService } from '../ports/IJwtService';

const makeRevokedTokenRepo = (): jest.Mocked<IRevokedTokenRepository> => ({
  revoke:    jest.fn().mockResolvedValue(undefined),
  isRevoked: jest.fn().mockResolvedValue(false),
});

const makeJwtMock = (): jest.Mocked<IJwtService> => ({
  sign:          jest.fn(),
  signRefresh:   jest.fn(),
  verify:        jest.fn(),
  verifyRefresh: jest.fn(),
});

describe('LogoutUseCase', () => {
  it('résout sans erreur si aucun refreshToken fourni', async () => {
    const useCase = new LogoutUseCase(makeRevokedTokenRepo(), makeJwtMock());
    await expect(useCase.execute({})).resolves.toBeUndefined();
  });

  it('révoque le refresh token valide', async () => {
    const revokedRepo = makeRevokedTokenRepo();
    const jwtMock     = makeJwtMock();
    jwtMock.verifyRefresh.mockReturnValue({ sub: 'u1', role: 'DRIVER', tenantId: 't1', exp: Math.floor(Date.now() / 1000) + 3600 });

    const useCase = new LogoutUseCase(revokedRepo, jwtMock);
    await useCase.execute({ refreshToken: 'valid-refresh-token' });

    expect(jwtMock.verifyRefresh).toHaveBeenCalledWith('valid-refresh-token');
    expect(revokedRepo.revoke).toHaveBeenCalledWith('valid-refresh-token', expect.any(Date));
  });

  it('résout sans erreur si le refresh token est déjà expiré', async () => {
    const revokedRepo = makeRevokedTokenRepo();
    const jwtMock     = makeJwtMock();
    jwtMock.verifyRefresh.mockImplementation(() => { throw new Error('expired'); });

    const useCase = new LogoutUseCase(revokedRepo, jwtMock);
    await expect(useCase.execute({ refreshToken: 'expired-token' })).resolves.toBeUndefined();
    expect(revokedRepo.revoke).not.toHaveBeenCalled();
  });
});
