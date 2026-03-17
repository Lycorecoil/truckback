/**
 * TEST 4 — Spike test : pic de trafic soudain (simule une campagne marketing)
 * Objectif : voir si le système survit à 200 users en 5 secondes
 * Lancer : docker run --rm -i --network host grafana/k6 run - < k6/04-spike-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s',  target: 5   },  // Normal
    { duration: '5s',  target: 200 },  // SPIKE brutal
    { duration: '30s', target: 200 },  // Tient sous charge
    { duration: '5s',  target: 5   },  // Retour normal
    { duration: '10s', target: 0   },
  ],
};

export default function () {
  const res = http.get('http://localhost:80/health');
  check(res, { 'toujours UP': (r) => r.status === 200 });
  sleep(0.1);
}
