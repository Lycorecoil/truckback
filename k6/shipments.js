/**
 * k6 load test — Shipment Service
 *
 * SLOs cibles :
 *   - p95 latence création expédition < 1 000 ms
 *   - p95 latence lecture             < 300 ms
 *   - taux d'erreur                   < 1 %
 *
 * Usage :
 *   k6 run k6/shipments.js
 *   BASE_URL=http://staging.example.com k6 run k6/shipments.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3006';

const createLatency = new Trend('shipment_create_latency', true);
const listLatency   = new Trend('shipment_list_latency',   true);
const createErrors  = new Counter('shipment_create_errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    shipment_create_latency: ['p(95)<1000'],
    shipment_list_latency:   ['p(95)<300'],
    http_req_failed:         ['rate<0.01'],
  },
};

const HEADERS = { 'Content-Type': 'application/json' };

export function setup() {
  // Login pour obtenir un token valide
  const res = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email: __ENV.TEST_EMAIL || 'admin@test.com', password: __ENV.TEST_PASSWORD || 'Admin@1234!' }),
    { headers: HEADERS },
  );
  if (res.status !== 200) {
    throw new Error(`setup: login failed ${res.status} — ${res.body}`);
  }
  const { accessToken } = JSON.parse(res.body);
  return { accessToken };
}

export default function (data) {
  const authHeaders = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.accessToken}`,
  };

  // ─── Créer une expédition ─────────────────────────────────────────────────
  const shipment = {
    description:  `Chargement test VU-${__VU}`,
    poids:        Math.floor(Math.random() * 5000) + 500,
    villeDepart:  'Cotonou',
    paysDepart:   'Bénin',
    villeArrivee: 'Lomé',
    paysArrivee:  'Togo',
  };

  const createRes = http.post(
    `${BASE_URL}/v1/shipment/shipments`,
    JSON.stringify(shipment),
    { headers: authHeaders },
  );
  createLatency.add(createRes.timings.duration);
  const createOk = check(createRes, {
    'create shipment 201': (r) => r.status === 201,
  });
  if (!createOk) createErrors.add(1);

  sleep(0.5);

  // ─── Lister les expéditions ───────────────────────────────────────────────
  const listRes = http.get(`${BASE_URL}/v1/shipment/shipments`, { headers: authHeaders });
  listLatency.add(listRes.timings.duration);
  check(listRes, {
    'list shipments 200': (r) => r.status === 200,
  });

  sleep(1);
}
