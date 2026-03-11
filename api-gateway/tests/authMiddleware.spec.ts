import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/middleware/authMiddleware';

const JWT_SECRET = 'test-secret';

beforeEach(() => {
  process.env['JWT_SECRET'] = JWT_SECRET;
});

afterEach(() => {
  delete process.env['JWT_SECRET'];
});

const makeMocks = (path = '/company/shipments') => {
  const req = {
    path,
    headers: {} as Record<string, string>,
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next };
};

describe('authMiddleware', () => {
  describe('protected routes', () => {
    it('should return 401 with { error: "Missing token" } when Authorization header is absent', () => {
      const { req, res, next } = makeMocks();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with { error: "Missing token" } when Authorization header does not start with Bearer', () => {
      const { req, res, next } = makeMocks();
      req.headers['authorization'] = 'Basic dXNlcjpwYXNz';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with { error: "Invalid token" } when token is malformed', () => {
      const { req, res, next } = makeMocks();
      req.headers['authorization'] = 'Bearer this.is.garbage';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with { error: "Invalid token" } when token is expired', () => {
      const { req, res, next } = makeMocks();
      const expiredToken = jwt.sign(
        { sub: 'user-1', role: 'COMPANY', tenantId: 'tenant-1' },
        JWT_SECRET,
        { expiresIn: -1 },
      );
      req.headers['authorization'] = `Bearer ${expiredToken}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() and attach x-user-id, x-user-role, x-tenant-id headers when token is valid', () => {
      const { req, res, next } = makeMocks();
      const token = jwt.sign(
        { sub: 'user-42', role: 'DRIVER', tenantId: 'tenant-99' },
        JWT_SECRET,
        { expiresIn: '15m' },
      );
      req.headers['authorization'] = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.headers['x-user-id']).toBe('user-42');
      expect(req.headers['x-user-role']).toBe('DRIVER');
      expect(req.headers['x-tenant-id']).toBe('tenant-99');
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('public routes', () => {
    it('should call next() without checking token for /auth/signup', () => {
      const { req, res, next } = makeMocks('/auth/signup');

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() without checking token for /auth/login', () => {
      const { req, res, next } = makeMocks('/auth/login');

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
