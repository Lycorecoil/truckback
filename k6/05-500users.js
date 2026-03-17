/**
 * TEST 500 users simultanés — avant/après --max-old-space-size=256
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '10s', target: 300 },
    { duration: '10s', target: 500 },
    { duration: '30s', target: 500 },
    { duration: '10s', target: 0   },
  ],
};

export default function () {
  const res = http.get('http://localhost:80/health');
  check(res, { 'UP': (r) => r.status === 200 || r.status === 429 });
  sleep(0.1);
}
