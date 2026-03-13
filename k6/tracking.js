/**
 * k6 load test — Tracking Service
 *
 * SLOs cibles :
 *   - p95 latence envoi position GPS  < 200 ms
 *   - p95 latence lecture historique  < 400 ms
 *   - taux d'erreur                   < 0.5 %
 *
 * Usage :
 *   k6 run k6/tracking.js
 *   k6 run --vus 100 --duration 3m k6/tracking.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3006';

const postLatency    = new Trend('tracking_post_latency',    true);
const historyLatency = new Trend('tracking_history_latency', true);
const postErrors     = new Counter('tracking_post_errors');

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '2m',  target: 100 },  // simulation trafic temps-réel 100 camions
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    tracking_post_latency:    ['p(95)<200'],
    tracking_history_latency: ['p(95)<400'],
    tracking_post_errors:     ['count<20'],
    http_req_failed:          ['rate<0.005'],
  },
};

const HEADERS = { 'Content-Type': 'application/json' };

export function setup() {
  const res = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email: __ENV.TEST_EMAIL || 'driver@test.com', password: __ENV.TEST_PASSWORD || 'Driver@1234!' }),
    { headers: HEADERS },
  );
  if (res.status !== 200) {
    throw new Error(`setup: driver login failed ${res.status}`);
  }
  const { accessToken } = JSON.parse(res.body);
  return { accessToken };
}

// Simule un parcours GPS autour de Cotonou
function nextPosition(iter) {
  const baseLat = 6.3703;
  const baseLon = 2.3912;
  return {
    latitude:  baseLat  + (iter % 50) * 0.001,
    longitude: baseLon  + (iter % 30) * 0.001,
    vitesse:   Math.floor(Math.random() * 120),
  };
}

export default function (data) {
  const authHeaders = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.accessToken}`,
  };

  // Chaque VU simule un camion distinct
  const truckId    = `truck-loadtest-${__VU}`;
  const shipmentId = `shipment-loadtest-${__VU}`;
  const pos        = nextPosition(__ITER);

  // ─── Envoyer une position GPS ─────────────────────────────────────────────
  const postRes = http.post(
    `${BASE_URL}/v1/tracking/tracking`,
    JSON.stringify({ truckId, shipmentId, ...pos }),
    { headers: authHeaders },
  );
  postLatency.add(postRes.timings.duration);
  const postOk = check(postRes, {
    'tracking post 201': (r) => r.status === 201,
  });
  if (!postOk) postErrors.add(1);

  sleep(0.2);

  // ─── Lire historique (toutes les 5 itérations pour ne pas saturer) ────────
  if (__ITER % 5 === 0) {
    const histRes = http.get(
      `${BASE_URL}/v1/tracking/tracking/truck/${truckId}/history`,
      { headers: authHeaders },
    );
    historyLatency.add(histRes.timings.duration);
    check(histRes, {
      'tracking history 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
