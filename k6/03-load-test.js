/**
 * TEST 3 — Load test complet avec JWT
 * Objectif : simuler 50 users en parallèle sur les endpoints principaux
 *
 * AVANT DE LANCER : remplacer JWT_TOKEN par un vrai token (via Postman ou login ci-dessous)
 *
 * Lancer : docker run --rm -i --network host grafana/k6 run - < k6/03-load-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

// ─── Remplace par ton token JWT ────────────────────────────────────────────────
const JWT_TOKEN = __ENV.JWT_TOKEN || 'REMPLACE_PAR_TON_TOKEN';

export const options = {
  stages: [
    { duration: '20s', target: 10  },  // Montée douce
    { duration: '40s', target: 50  },  // Charge maximale
    { duration: '20s', target: 0   },  // Descente
  ],
  thresholds: {
    http_req_failed:   ['rate<0.05'],   // < 5% erreurs acceptées
    http_req_duration: ['p(99)<2000'],  // P99 < 2s
  },
};

const BASE = 'http://localhost:80';
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`,
};

export default function () {
  // Simule un utilisateur qui navigue dans l'app
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% — Consultation des shipments
    const r = http.get(`${BASE}/v1/shipments`, { headers: HEADERS });
    check(r, { 'shipments OK': (res) => res.status === 200 || res.status === 401 });

  } else if (scenario < 0.7) {
    // 30% — Consultation de la flotte
    const r = http.get(`${BASE}/v1/fleet/trucks`, { headers: HEADERS });
    check(r, { 'fleet OK': (res) => res.status === 200 || res.status === 401 });

  } else if (scenario < 0.9) {
    // 20% — Profil entreprise
    const r = http.get(`${BASE}/v1/companies`, { headers: HEADERS });
    check(r, { 'companies OK': (res) => res.status === 200 || res.status === 401 });

  } else {
    // 10% — Health check
    const r = http.get(`${BASE}/health`);
    check(r, { 'health OK': (res) => res.status === 200 });
  }

  sleep(Math.random() * 1 + 0.2); // délai aléatoire 0.2s–1.2s
}
