import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
}

/**
 * Store AsyncLocalStorage — permet de propager le X-Request-ID
 * automatiquement dans tous les appels HTTP inter-services
 * sans modifier les signatures de fonction.
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCurrentRequestId(): string {
  return requestContext.getStore()?.requestId ?? 'unknown';
}
