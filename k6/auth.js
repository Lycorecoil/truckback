/**
 * k6 load test — Auth Service
 *
 * SLOs cibles :
 *   - p95 latence login  < 500 ms
 *   - p95 latence signup < 800 ms
 *   - taux d'erreur      < 1 %
 *
 * Usage :
 *   k6 run k6/auth.js
 *   k6 run --vus 50 --duration 2m k6/auth.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3006';

const loginLatency  = new Trend('login_latency',  true);
const signupLatency = new Trend('signup_latency', true);
const loginErrors   = new Counter('login_errors');
const signupErrors  = new Counter('signup_errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // montée en charge
    { duration: '1m',  target: 50 },   // charge soutenue
    { duration: '20s', target: 0 },    // descente
  ],
  thresholds: {
    login_latency:  ['p(95)<500'],
    signup_latency: ['p(95)<800'],
    login_errors:   ['count<10'],
    http_req_failed: ['rate<0.01'],
  },
};

const HEADERS = { 'Content-Type': 'application/json' };

export function setup() {
  // Crée un compte de test réutilisable pour les tests de login
  const email    = `loadtest-${Date.now()}@example.com`;
  const password = 'LoadTest@1234!';
  const res = http.post(
    `${BASE_URL}/v1/auth/signup`,
    JSON.stringify({ email, password, role: 'COMPANY', tenantId: 'tenant-loadtest' }),
    { headers: HEADERS },
  );
  if (res.status !== 201) {
    console.warn(`setup: signup failed with status ${res.status} — ${res.body}`);
  }
  return { email, password };
}

export default function (data) {
  // ─── Test login ──────────────────────────────────────────────────────────
  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email: data.email, password: data.password }),
    { headers: HEADERS },
  );
  loginLatency.add(loginRes.timings.duration);
  const loginOk = check(loginRes, {
    'login status 200':      (r) => r.status === 200,
    'login has accessToken': (r) => {
      try { return JSON.parse(r.body).accessToken !== undefined; }
      catch { return false; }
    },
  });
  if (!loginOk) loginErrors.add(1);

  sleep(0.5);

  // ─── Test signup (utilisateur unique par VU + itération) ─────────────────
  const email    = `vu-${__VU}-iter-${__ITER}-${Date.now()}@example.com`;
  const signupRes = http.post(
    `${BASE_URL}/v1/auth/signup`,
    JSON.stringify({ email, password: 'LoadTest@1234!', role: 'COMPANY', tenantId: `tenant-${__VU}` }),
    { headers: HEADERS },
  );
  signupLatency.add(signupRes.timings.duration);
  const signupOk = check(signupRes, {
    'signup status 201': (r) => r.status === 201,
  });
  if (!signupOk) signupErrors.add(1);

  sleep(1);
}
