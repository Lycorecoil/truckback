import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues.map((i) => i.message).join('; ') });
      return;
    }
    req.body = result.data;
    next();
  };
}
