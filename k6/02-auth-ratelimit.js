/**
 * TEST 2 — Rate limiting auth : déclenche les 429 sur /auth/login
 * Objectif : vérifier que le rate limiter Nginx bloque les attaques brute force
 * Lancer : docker run --rm -i --network host grafana/k6 run - < k6/02-auth-ratelimit.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
};

export default function () {
  const res = http.post(
    'http://localhost:80/v1/auth/login',
    JSON.stringify({ email: 'attacker@evil.com', password: 'bruteforce123' }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  // On attend soit 401 (creds invalides) soit 429 (rate limited)
  check(res, {
    'bloqué ou refusé': (r) => r.status === 401 || r.status === 429,
  });

  sleep(0.1); // 10 req/s par VU → déclenche le rate limit rapidement
}
