# api-gateway — Instructions pour Claude

## Projet global : Camion Uber

Plateforme logistique B2B microservices — mise en relation transporteurs et entreprises.
Services : Auth (3000), Company (3001), Fleet (3002), Shipment (3003), Tracking (3004), Notification (3005), API Gateway (3006).

## Ce service : API Gateway (PORT 3006)

Point d'entrée unique du système. Responsabilités exclusives :
1. Valider le JWT sur toutes les routes (sauf publiques)
2. Attacher les headers `x-user-id`, `x-user-role`, `x-tenant-id` aux requêtes proxiées
3. Appliquer le rate limiting global
4. Proxy les requêtes vers les microservices en aval

**Pas de logique métier. Pas de Prisma. Pas de bcrypt. Pas de couche domain/application.**

Stack : Node.js 18, TypeScript strict, Express.js, helmet, cors, morgan, express-rate-limit, http-proxy-middleware, jsonwebtoken, Jest + ts-jest.

## Architecture

```
src/
├── config/services.ts          → ServiceUrls interface + getServiceUrls() fail-fast
├── middleware/
│   ├── authMiddleware.ts       → JWT verify → headers x-user-* injectés
│   ├── rateLimitMiddleware.ts  → express-rate-limit configurable via env
│   └── loggerMiddleware.ts     → morgan dev|combined selon NODE_ENV
├── proxy/
│   └── proxyRouter.ts          → createProxyMiddleware + pathRewrite par préfixe
├── server.ts                   → createApp()
└── main.ts                     → PORT=3006
tests/
└── authMiddleware.spec.ts      → 7 tests TDD
```

## Flux d'une requête

```
Client
  → [1] rateLimitMiddleware   — 429 si quota dépassé
  → [2] authMiddleware        — 401 si token absent/invalide (routes publiques bypassed)
  → [3] proxyRouter           — pathRewrite + forward vers service aval
  → [4] Service aval          — répond avec ses propres status codes
  → Client
```

Routes publiques (bypass JWT) : `/auth/signup`, `/auth/login`

## Routes proxiées

| Préfixe gateway | Service cible | Port |
|---|---|---|
| `/auth/*` | auth-service | 3000 |
| `/company/*` | company-service | 3001 |
| `/fleet/*` | fleet-service | 3002 |
| `/shipment/*` | shipment-service | 3003 |
| `/tracking/*` | tracking-service | 3004 |
| `/notification/*` | notification-service | 3005 |

## Headers injectés par authMiddleware

| Header | Source JWT | Exemple |
|---|---|---|
| `x-user-id` | `payload.sub` | `"user-uuid-1234"` |
| `x-user-role` | `payload.role` | `"ADMIN"` |
| `x-tenant-id` | `payload.tenantId` | `"tenant-001"` |

Les services en aval **font confiance à ces headers** sans re-vérifier le JWT.

## Patterns validés

- **Ordre middleware immuable** : `helmet → cors → morgan → rateLimit → /health → authMiddleware → proxyRouter → 404`
- **PAS de `express.json()`** — le gateway ne parse pas le body, il le transmet tel quel
- `process.env['KEY']?.split(',')` pour `ALLOWED_ORIGINS` (liste CSV)
- **Fail-fast dans `services.ts`** : `if (!url) throw new Error('...')` — refus de démarrer avec config incomplète
- `pathRewrite: { ['^/prefix']: '' }` — le préfixe gateway est supprimé avant forward
- `changeOrigin: true` obligatoire sur tous les proxies
- `process.env['KEY']` bracket notation (pas dot notation)
- **`JWT_SECRET` identique** à auth-service — même clé symétrique HS256
- `if (!jwtSecret) throw new Error(...)` dans authMiddleware — pas de fallback

## Variables d'environnement requises

```env
PORT=3006
NODE_ENV=development
JWT_SECRET=<même valeur que auth-service>
AUTH_SERVICE_URL=http://localhost:3000
COMPANY_SERVICE_URL=http://localhost:3001
FLEET_SERVICE_URL=http://localhost:3002
SHIPMENT_SERVICE_URL=http://localhost:3003
TRACKING_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

## Commandes

```bash
npm run dev      # ts-node + dotenv (NODE_NO_WARNINGS=1)
npm test         # jest — 7 tests authMiddleware
npm run build    # tsc → dist/
npx tsc --noEmit
```

## Tests (7 cas — authMiddleware.spec.ts)

| # | Cas | Résultat |
|---|---|---|
| 1 | Pas de header Authorization | 401 `{ error: 'Missing token' }` |
| 2 | Header non-Bearer | 401 `{ error: 'Missing token' }` |
| 3 | JWT malformé | 401 `{ error: 'Invalid token' }` |
| 4 | JWT expiré | 401 `{ error: 'Invalid token' }` |
| 5 | JWT valide | next() + headers x-user-* attachés |
| 6 | Route `/auth/signup` | next() sans vérifier le token |
| 7 | Route `/auth/login` | next() sans vérifier le token |

## Ajouter une nouvelle route proxiée

1. Ajouter `NEW_SERVICE_URL` dans `.env` et `.env.example`
2. Ajouter dans `src/config/services.ts` : `newService: requireEnv('NEW_SERVICE_URL')`
3. Ajouter dans `proxyRouter.ts` : `router.use('/new', proxy(services.newService, '/new'))`

## Lien avec les autres services

| Service | Port | Interaction |
|---|---|---|
| Auth | 3000 | Routes publiques `/auth/signup` et `/auth/login` |
| Company | 3001 | Proxié sous `/company/*` |
| Fleet | 3002 | Proxié sous `/fleet/*` |
| Shipment | 3003 | Proxié sous `/shipment/*` |
| Tracking | 3004 | Proxié sous `/tracking/*` |
| Notification | 3005 | Proxié sous `/notification/*` |

## Préférences de travail

- Réponses en français
- Approche pédagogique : expliquer avant d'écrire
- Avancer étape par étape
