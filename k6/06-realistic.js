/**
 * Test de charge réaliste — parcours utilisateur complet
 * IPs simulées via X-Forwarded-For (1 IP unique par VU)
 * Durée : 2 minutes par palier
 *
 * Usage :
 *   docker run --rm -i --network host -e TARGET_VUS=50 grafana/k6 run - < k6/06-realistic.js
 *
 * Paliers : 50 → 100 → 200 → 500 → 1000 → 2000 → 5000 → 10000
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// ─── Métriques custom ────────────────────────────────────────────────────────
const loginErrors    = new Counter('login_errors');
const loginDuration  = new Trend('login_duration_ms', true);
const actionDuration = new Trend('action_duration_ms', true);

// ─── Paramètres ─────────────────────────────────────────────────────────────
const TARGET_VUS = parseInt(__ENV.TARGET_VUS || '50', 10);
const BASE_URL   = __ENV.BASE_URL || 'http://localhost';

// Pool de comptes partagés (créés en setup)
const POOL_SIZE = Math.min(TARGET_VUS, 200); // max 200 comptes

export const options = {
  setupTimeout: '180s',
  scenarios: {
    realistic_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: TARGET_VUS }, // montée progressive
        { duration: '90s', target: TARGET_VUS }, // charge constante
        { duration: '10s', target: 0           }, // descente
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // P95 < 3s
    http_req_failed:   ['rate<0.05'],   // < 5% d'erreurs réelles
    login_errors:      ['count<10'],    // moins de 10 erreurs de login
  },
};

// ─── Génère une IP aléatoire unique par VU ───────────────────────────────────
function randomIP(vuId) {
  // Chaque VU a une IP stable mais différente : 10.VU_HIGH.VU_LOW.1
  const high = Math.floor(vuId / 256) % 256;
  const low  = vuId % 256;
  return `10.${high}.${low}.1`;
}

// ─── Setup : crée le pool d'utilisateurs de test ─────────────────────────────
export function setup() {
  console.log(`[setup] Création de ${POOL_SIZE} utilisateurs de test...`);
  const users = [];
  const tenantId = 'load-test-tenant';

  for (let i = 0; i < POOL_SIZE; i++) {
    const email    = `loadtest_${i}_${Date.now()}@test.com`;
    const password = `LoadTest${i}Pass`;

    const res = http.post(
      `${BASE_URL}/v1/auth/signup`,
      JSON.stringify({
        email,
        password,
        role: 'COMPANY',
        tenantId,
        firstName: `User${i}`,
        lastName: 'LoadTest',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 201 || res.status === 200) {
      users.push({ email, password });
    } else {
      console.warn(`[setup] signup échoué pour user ${i}: ${res.status} ${res.body}`);
    }
  }

  console.log(`[setup] ${users.length} utilisateurs créés sur ${POOL_SIZE} demandés`);
  return { users };
}

// ─── Parcours utilisateur réaliste ───────────────────────────────────────────
export default function (data) {
  const { users } = data;
  if (!users || users.length === 0) return;

  // Chaque VU choisit un compte du pool (distribution round-robin)
  const user = users[__VU % users.length];
  const ip   = randomIP(__VU);

  const headers = {
    'Content-Type':    'application/json',
    'X-Forwarded-For': ip,
  };

  // ── Étape 1 : Login ─────────────────────────────────────────────────────
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers }
  );

  loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    'login 200': (r) => r.status === 200,
    'login a un token': (r) => {
      try { return JSON.parse(r.body).token !== undefined; } catch { return false; }
    },
  });

  if (!loginOk) {
    loginErrors.add(1);
    sleep(1);
    return;
  }

  let token;
  try {
    token = JSON.parse(loginRes.body).token;
  } catch {
    loginErrors.add(1);
    return;
  }

  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${token}`,
  };

  // Pause réaliste après login (utilisateur qui lit la page)
  sleep(Math.random() * 1.5 + 0.5); // 0.5s – 2s

  // ── Étape 2 : Actions métier aléatoires (3 à 5 actions par session) ─────
  const numActions = Math.floor(Math.random() * 3) + 3;

  for (let i = 0; i < numActions; i++) {
    const action = Math.floor(Math.random() * 4);
    const actionStart = Date.now();

    switch (action) {
      case 0: {
        // Lister les organisations (company)
        const r = http.get(`${BASE_URL}/v1/company/company`, { headers: authHeaders });
        check(r, { 'GET company 200': (res) => res.status === 200 || res.status === 403 });
        break;
      }
      case 1: {
        // Lister les shipments
        const r = http.get(`${BASE_URL}/v1/shipments/shipments`, { headers: authHeaders });
        check(r, { 'GET shipments 200': (res) => res.status === 200 || res.status === 403 });
        break;
      }
      case 2: {
        // Lister les transporteurs
        const r = http.get(`${BASE_URL}/v1/company/transporter`, { headers: authHeaders });
        check(r, { 'GET transporter 200': (res) => res.status === 200 || res.status === 403 });
        break;
      }
      case 3: {
        // Lister les camions
        const r = http.get(`${BASE_URL}/v1/fleet/trucks`, { headers: authHeaders });
        check(r, { 'GET trucks 200': (res) => res.status === 200 || res.status === 403 });
        break;
      }
    }

    actionDuration.add(Date.now() - actionStart);

    // Pause entre actions (simule le temps de lecture/interaction)
    sleep(Math.random() * 2 + 1); // 1s – 3s
  }
}

// ─── Teardown : résumé ────────────────────────────────────────────────────────
export function teardown(data) {
  console.log(`[teardown] Test terminé. ${data.users?.length || 0} utilisateurs utilisés.`);
}
