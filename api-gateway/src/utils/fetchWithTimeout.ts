const DEFAULT_TIMEOUT_MS = 5_000;

/** fetch() avec timeout — lève une erreur si la réponse dépasse le délai. */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`HTTP timeout après ${timeoutMs}ms — ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
