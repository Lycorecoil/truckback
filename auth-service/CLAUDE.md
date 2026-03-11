# auth-service — Instructions pour Claude

## Projet global : Camion Uber

Plateforme logistique B2B microservices — mise en relation transporteurs et entreprises.
Services : Auth (3000), Company (3001), Fleet (3002), Shipment (3003), Tracking (3004), Notification (3005), API Gateway (3006).

## Ce service : Auth Service (PORT 3000)

Gère l'authentification et les identités. Émet les JWT consommés par l'API Gateway pour toutes les requêtes protégées du système.

Stack : Node.js 18, TypeScript strict, Express.js, Prisma 6, MongoDB (replica set), bcrypt, jsonwebtoken, Jest + ts-jest.

## Architecture — Clean Architecture

```
src/
├── domain/
│   ├── entities/User.ts           # User class, UserRole enum
│   ├── value-objects/Email.ts     # Validation regex
│   ├── value-objects/Password.ts  # bcrypt hash/verify async
│   ├── repositories/IUserRepository.ts
│   └── errors/DomainError.ts
├── application/
│   ├── ports/IJwtService.ts
│   ├── dtos/                      # SignUpDTO, LoginDTO, CreateDriverDTO
│   └── use-cases/                 # 1 fichier par use case
└── infrastructure/
    ├── config/container.ts        # Composition root — DI manuelle
    ├── http/
    │   ├── server.ts              # createApp()
    │   ├── router.ts
    │   ├── controllers/AuthController.ts
    │   └── middleware/            # jwtMiddleware, errorMiddleware
    ├── repositories/PrismaUserRepository.ts
    └── services/JwtService.ts
```

## Entité User

```typescript
enum UserRole {
  ADMIN       = 'ADMIN',
  COMPANY     = 'COMPANY',
  TRANSPORTER = 'TRANSPORTER',
  DRIVER      = 'DRIVER',
}

interface UserProps {
  id: string;        // crypto.randomUUID() — jamais de package uuid
  tenantId: string;  // isolation multi-tenant
  email: string;     // validé par value-object Email
  password: string;  // bcrypt hash — jamais en clair
  role: UserRole;
  createdAt: Date;
}
```

## JWT Payload

```typescript
interface JWTPayload {
  sub: string;      // userId
  tenantId: string;
  role: string;     // UserRole
  iat?: number;
  exp?: number;
}
```

## Patterns validés

- `process.env['KEY']` — bracket notation obligatoire (pas `process.env.KEY`)
- `crypto.randomUUID()` — natif Node 18, jamais le package `uuid`
- **Jamais `prisma.user.upsert()`** — requiert transactions replica set → `findUnique` + `create`/`update` séparément
- **Fail-fast** : `if (!secret) throw new Error('JWT_SECRET is required')` — pas de `?? 'fallback'`
- **DI manuelle** par constructeur dans `container.ts` — pas de framework DI (inversify, tsyringe…)
- `NODE_ENV=development npm install` — obligatoire (production skippe les devDeps)
- `import 'dotenv/config'` en première ligne de `main.ts`
- Middleware d'erreurs en **dernier** dans `server.ts`
- Les use cases reçoivent leurs dépendances en constructeur → facilitent les mocks Jest
- `returnDocument: "after"` si Mongoose est introduit (pas `new: true`)

## Variables d'environnement requises

```
PORT=3000
DATABASE_URL=mongodb://localhost:27017/camion-uber-dev?replicaSet=rs0&directConnection=true
JWT_SECRET=<secret_aléatoire_32_chars_min>
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## MongoDB replica set (Prisma 6 l'exige pour toute écriture)

```bash
# Ajouter dans mongod.conf :
# replication:
#   replSetName: "rs0"
sudo systemctl restart mongod
mongosh --eval "rs.initiate()"
```

## Commandes

```bash
npm run dev          # ts-node + dotenv (NODE_NO_WARNINGS=1)
npm test             # jest — 14 tests, 5 suites
npm run build        # tsc → dist/
npx tsc --noEmit     # vérification types
npx prisma generate  # regénérer après schema change
```

## Endpoints

| Méthode | Route | Auth | Status succès |
|---------|-------|------|---------------|
| GET | `/health` | Non | 200 |
| POST | `/signup` | Non | 201 |
| POST | `/login` | Non | 200 |
| POST | `/driver/create` | JWT (ADMIN) | 201 |
| POST | `/logout` | JWT | 204 |
| POST | `/reset-password` | Non | 200 |

## Lien avec les autres services

| Service | Port | Interaction |
|---------|------|-------------|
| API Gateway | 3006 | Consomme les JWT signés ici — même `JWT_SECRET` |
| Notification | 3005 | Peut envoyer un email de bienvenue post-signup |

## Préférences de travail

- Réponses en français
- Approche TDD : Red → Green → Refactor
- Approche pédagogique : expliquer avant d'écrire
- Avancer étape par étape — ne pas tout réécrire d'un coup
