/**
 * TEST 1 — Sanity check : 10 users, 30s
 * Objectif : vérifier que tout répond avant de monter en charge
 * Lancer : docker run --rm -i --network host grafana/k6 run - < k6/01-health-check.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // < 1% d'erreurs
    http_req_duration: ['p(95)<500'],   // P95 < 500ms
  },
};

export default function () {
  const res = http.get('http://localhost:80/health');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(0.5);
}
