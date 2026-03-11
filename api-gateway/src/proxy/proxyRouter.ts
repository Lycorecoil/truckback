import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServiceUrls } from '../config/services';

export function createProxyRouter(services: ServiceUrls): Router {
  const router = Router();

  const proxy = (target: string, pathPrefix: string) =>
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${pathPrefix}`]: '' },
      on: {
        error: (err, _req, res) => {
          console.error(`[api-gateway] Proxy error → ${target}:`, (err as Error).message);
          const httpRes = res as import('http').ServerResponse;
          httpRes.writeHead(502, { 'Content-Type': 'application/json' });
          httpRes.end(JSON.stringify({ error: 'Service unavailable' }));
        },
      },
    });

  router.use('/auth', proxy(services.auth, '/auth'));
  router.use('/company', proxy(services.company, '/company'));
  router.use('/fleet', proxy(services.fleet, '/fleet'));
  router.use('/shipment', proxy(services.shipment, '/shipment'));
  router.use('/notification', proxy(services.notification, '/notification'));
  router.use('/tracking', proxy(services.tracking, '/tracking'));

  return router;
}
