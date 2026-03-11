# API Gateway

Point d'entrée unique de la plateforme **Camion Uber**.

---

## Rôle

Ce service est la **porte d'entrée de tout le système**. Il valide les JWT, applique le rate limiting et redirige chaque requête vers le microservice concerné via un proxy HTTP. Il ne contient **aucune logique métier**.

---

## Stack

- **Runtime** : Node.js 18
- **Langage** : TypeScript strict
- **Framework** : Express.js
- **Sécurité** : helmet · cors · express-rate-limit
- **Proxy** : http-proxy-middleware
- **Auth** : jsonwebtoken (HS256)
- **Logging** : morgan
- **Tests** : Jest + ts-jest (TDD)

---

## Installation

```bash
NODE_ENV=development npm install
```

---

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port HTTP | `3006` |
| `NODE_ENV` | Environnement | `development` |
| `JWT_SECRET` | Clé de vérification JWT (identique à auth-service) | — |
| `AUTH_SERVICE_URL` | URL d'auth-service | `http://localhost:3000` |
| `COMPANY_SERVICE_URL` | URL de company-service | `http://localhost:3001` |
| `FLEET_SERVICE_URL` | URL de fleet-service | `http://localhost:3002` |
| `SHIPMENT_SERVICE_URL` | URL de shipment-service | `http://localhost:3003` |
| `TRACKING_SERVICE_URL` | URL de tracking-service | `http://localhost:3004` |
| `NOTIFICATION_SERVICE_URL` | URL de notification-service | `http://localhost:3005` |
| `ALLOWED_ORIGINS` | Origines CORS autorisées (CSV) | `http://localhost:3000,http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Fenêtre de rate limiting (ms) | `60000` |
| `RATE_LIMIT_MAX` | Nb max requêtes par fenêtre | `100` |

> Le service refuse de démarrer si une `*_SERVICE_URL` est absente.

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Démarre en mode développement (ts-node + dotenv) |
| `npm test` | Lance les tests (7 tests, 1 suite) |
| `npm run build` | Compile TypeScript vers `dist/` |

---

## Architecture

```
src/
├── config/services.ts          → URLs des services en aval (fail-fast si manquant)
├── middleware/
│   ├── authMiddleware.ts       → Vérifie JWT, injecte x-user-id / x-user-role / x-tenant-id
│   ├── rateLimitMiddleware.ts  → 100 req/min par IP (configurable)
│   └── loggerMiddleware.ts     → morgan dev (dev) ou combined (prod)
├── proxy/
│   └── proxyRouter.ts          → createProxyMiddleware + pathRewrite par préfixe
├── server.ts                   → createApp() — chaîne de middlewares
└── main.ts                     → PORT=3006
tests/
└── authMiddleware.spec.ts      → 7 tests TDD
```

---

## Flux d'une requête

```
1. Client envoie  POST http://localhost:3006/auth/signup
2. rateLimitMiddleware   → passe (quota non atteint)
3. authMiddleware        → route publique /auth/signup → bypass JWT → next()
4. proxyRouter           → préfixe /auth → pathRewrite supprime /auth
5. Proxy forward vers    → POST http://localhost:3000/signup
6. auth-service répond   → 201 { token: "..." }
7. Gateway retransmet    → Client reçoit 201 { token: "..." }
```

Pour une route protégée, l'étape 3 vérifie le JWT et injecte les headers `x-user-id`, `x-user-role`, `x-tenant-id` avant le forward.

---

## Routes proxiées

| Préfixe gateway | Service cible | Port |
|---|---|---|
| `/auth/*` | auth-service | 3000 |
| `/company/*` | company-service | 3001 |
| `/fleet/*` | fleet-service | 3002 |
| `/shipment/*` | shipment-service | 3003 |
| `/tracking/*` | tracking-service | 3004 |
| `/notification/*` | notification-service | 3005 |

**Routes publiques** (sans JWT) : `/auth/signup`, `/auth/login`

---

## Headers injectés

Pour chaque requête avec JWT valide, le gateway attache ces headers avant le forward :

| Header | Valeur | Source |
|---|---|---|
| `x-user-id` | userId | `payload.sub` |
| `x-user-role` | ADMIN / COMPANY / DRIVER… | `payload.role` |
| `x-tenant-id` | tenantId | `payload.tenantId` |

Les services en aval lisent ces headers sans re-vérifier le JWT.

---

## Réponses d'erreur du gateway

| Status | Message | Cause |
|---|---|---|
| 401 | `{ "error": "Missing token" }` | Header Authorization absent ou non-Bearer |
| 401 | `{ "error": "Invalid token" }` | JWT malformé, expiré ou mauvaise signature |
| 429 | `{ "error": "Too many requests, please try again later." }` | Rate limit dépassé |
| 502 | `{ "error": "Service unavailable" }` | Service en aval non joignable |
| 404 | `{ "error": "Route not found" }` | Préfixe inconnu |

---

## Tests

```bash
npm test
```

```
Test Suites: 1 passed
Tests:       7 passed
```

Suite : `authMiddleware` — 5 cas routes protégées + 2 cas routes publiques.

---

## CORS

Les origines autorisées sont définies dans `ALLOWED_ORIGINS` (liste séparée par des virgules).

```
# Développement
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production
ALLOWED_ORIGINS=https://app.camionuber.com
```

---

## Tests API avec curl

```bash
# Health check
curl http://localhost:3006/health

# Route publique — inscription (pas de token requis)
curl -X POST http://localhost:3006/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Secret123!","tenantId":"tenant-001"}'

# Connexion — récupère le token
TOKEN=$(curl -s -X POST http://localhost:3006/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Secret123!"}' | jq -r '.token')

# Route protégée via gateway
curl -X POST http://localhost:3006/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Test 401 — sans token
curl -X POST http://localhost:3006/auth/logout

# Test 401 — token invalide
curl -X POST http://localhost:3006/auth/logout \
  -H "Authorization: Bearer token.invalide.ici"
```

---

## Lien avec les autres services

| Service | Port | Interaction |
|---|---|---|
| Auth | 3000 | Fournit les JWT — même `JWT_SECRET` obligatoire |
| Company | 3001 | Proxié sous `/company/*` |
| Fleet | 3002 | Proxié sous `/fleet/*` |
| Shipment | 3003 | Proxié sous `/shipment/*` |
| Tracking | 3004 | Proxié sous `/tracking/*` |
| Notification | 3005 | Proxié sous `/notification/*` |
