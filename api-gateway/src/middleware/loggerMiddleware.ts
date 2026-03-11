import morgan from 'morgan';

export const loggerMiddleware = morgan(
  process.env['NODE_ENV'] === 'production' ? 'combined' : 'dev',
);
