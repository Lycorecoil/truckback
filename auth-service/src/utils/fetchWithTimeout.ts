import { getCurrentRequestId } from './requestContext';

const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * fetch() avec timeout et propagation automatique du X-Request-ID
 * depuis l'AsyncLocalStorage vers tous les appels HTTP inter-services.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const requestId = getCurrentRequestId();
  const headers: Record<string, string> = {
    'x-request-id': requestId,
    ...(options.headers as Record<string, string> | undefined ?? {}),
  };

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    return response;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(`HTTP timeout après ${timeoutMs}ms — ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * fetch() avec retry exponentiel + timeout + propagation X-Request-ID.
 * Retente uniquement sur erreur réseau/timeout (pas sur 4xx/5xx).
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  maxRetries: number = 3,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}
