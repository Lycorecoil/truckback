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
