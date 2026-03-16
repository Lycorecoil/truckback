import { logger } from './logger';

type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface BreakerState {
  state: State;
  failures: number;
  lastFailure: number;
}

const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT_MS  = 30_000;

const breakers = new Map<string, BreakerState>();

function getBreaker(key: string): BreakerState {
  if (!breakers.has(key)) {
    breakers.set(key, { state: 'CLOSED', failures: 0, lastFailure: 0 });
  }
  return breakers.get(key) as BreakerState;
}

/**
 * Exécute `fn` sous la protection d'un circuit breaker par `key`.
 *
 * - CLOSED  : appel normal.
 * - OPEN    : échoue immédiatement sans appel réseau (fail-fast).
 *             Passe en HALF_OPEN après RESET_TIMEOUT_MS.
 * - HALF_OPEN : laisse passer un seul appel de test.
 *               Succès → CLOSED. Échec → retour OPEN.
 *
 * Ouvre le circuit après FAILURE_THRESHOLD échecs consécutifs.
 */
export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const breaker = getBreaker(key);

  if (breaker.state === 'OPEN') {
    if (Date.now() - breaker.lastFailure > RESET_TIMEOUT_MS) {
      breaker.state = 'HALF_OPEN';
      logger.warn({ service: key }, '[circuit-breaker] HALF_OPEN — test de reconnexion');
    } else {
      throw new Error(`Service ${key} temporairement indisponible (circuit ouvert)`);
    }
  }

  try {
    const result = await fn();

    if (breaker.state !== 'CLOSED') {
      logger.info({ service: key }, '[circuit-breaker] Circuit rétabli → CLOSED');
    }
    breaker.failures = 0;
    breaker.state    = 'CLOSED';

    return result;
  } catch (err) {
    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.state === 'HALF_OPEN' || breaker.failures >= FAILURE_THRESHOLD) {
      breaker.state = 'OPEN';
      logger.error(
        { service: key, failures: breaker.failures },
        '[circuit-breaker] Circuit OUVERT — appels bloqués pendant 30s',
      );
    }

    throw err;
  }
}
