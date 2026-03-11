# Auth Service

Microservice d'**authentification et de gestion des identités** pour la plateforme **Camion Uber**.

---

## Rôle

Ce service gère l'inscription, la connexion et les rôles des utilisateurs. Il émet les **JWT** (JSON Web Tokens) consommés par l'API Gateway pour sécuriser toutes les requêtes du système.

---

## Stack

- **Runtime** : Node.js 18
- **Langage** : TypeScript strict
- **Framework** : Express.js
- **Base de données** : MongoDB via Prisma 6 (replica set obligatoire)
- **Auth** : jsonwebtoken (HS256) · bcrypt (12 rounds)
- **Tests** : Jest + ts-jest (TDD)

---

## Installation

```bash
NODE_ENV=development npm install
npx prisma generate
```

> `NODE_ENV=development` est obligatoire — sinon npm skippe les devDependencies.

---

## Variables d'environnement

Créer un fichier `.env` à la racine du service :

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port HTTP | `3000` |
| `DATABASE_URL` | URI MongoDB avec replica set | `mongodb://localhost:27017/camion-uber-dev?replicaSet=rs0&directConnection=true` |
| `JWT_SECRET` | Clé de signature JWT (32+ chars) | *(générer avec `openssl rand -hex 32`)* |
| `JWT_EXPIRES_IN` | Durée de validité du token | `7d` |
| `NODE_ENV` | Environnement | `development` |

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Démarre en mode développement (ts-node + dotenv) |
| `npm test` | Lance tous les tests (14 tests, 5 suites) |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npx prisma generate` | Régénère le client Prisma après changement de schema |

---

## Architecture

```
src/
├── domain/
│   ├── entities/User.ts           → User class, UserRole enum
│   ├── value-objects/Email.ts     → Validation regex
│   ├── value-objects/Password.ts  → bcrypt hash/verify
│   ├── repositories/IUserRepository.ts
│   └── errors/DomainError.ts     → UserAlreadyExistsError, InvalidCredentialsError…
├── application/
│   ├── ports/IJwtService.ts
│   ├── dtos/                      → SignUpDTO, LoginDTO, CreateDriverDTO
│   └── use-cases/                 → SignUpUseCase, LoginUseCase, CreateDriverUseCase…
└── infrastructure/
    ├── config/container.ts        → Composition root (DI manuelle)
    ├── http/
    │   ├── server.ts              → createApp()
    │   ├── router.ts
    │   ├── controllers/AuthController.ts
    │   └── middleware/            → jwtMiddleware, errorMiddleware
    ├── repositories/PrismaUserRepository.ts
    └── services/JwtService.ts
```

---

## Modèle de données

### User

```typescript
enum UserRole {
  ADMIN       = 'ADMIN',
  COMPANY     = 'COMPANY',
  TRANSPORTER = 'TRANSPORTER',
  DRIVER      = 'DRIVER',
}

interface User {
  id:        string;    // UUID (crypto.randomUUID)
  tenantId:  string;    // Isolation multi-tenant
  email:     string;    // Unique par tenant
  password:  string;    // bcrypt hash — jamais en clair
  role:      UserRole;
  createdAt: Date;
}
```

---

## API HTTP

Base URL : `http://localhost:3000`

### GET /health

```json
{ "status": "ok", "service": "auth-service" }
```

---

### POST /signup

Créer un nouvel utilisateur.

**Body :**

```json
{
  "email":    "user@example.com",
  "password": "Secret123!",
  "tenantId": "tenant-001"
}
```

**Réponses :**

```json
// 201 Created
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }

// 409 Conflict
{ "error": "Cet email est déjà utilisé." }
```

---

### POST /login

**Body :**

```json
{
  "email":    "user@example.com",
  "password": "Secret123!"
}
```

**Réponses :**

```json
// 200 OK
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }

// 401 Unauthorized
{ "error": "Identifiants invalides." }
```

---

### POST /driver/create

Créer un compte chauffeur. **Requiert un JWT avec `role: ADMIN`.**

**Header :** `Authorization: Bearer <token>`

**Body :**

```json
{
  "email":    "driver@example.com",
  "password": "Driver123!",
  "tenantId": "tenant-001"
}
```

**Réponses :**

```json
// 201 Created
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }

// 403 Forbidden
{ "error": "Accès non autorisé." }
```

---

### POST /logout

**Header :** `Authorization: Bearer <token>`

```
// 204 No Content
```

---

### POST /reset-password

**Body :**

```json
{ "email": "user@example.com" }
```

```json
// 200 OK
{ "message": "Email de réinitialisation envoyé." }
```

---

## JWT Payload

```json
{
  "sub":      "<userId>",
  "tenantId": "<tenantId>",
  "role":     "ADMIN | COMPANY | TRANSPORTER | DRIVER",
  "iat":      1700000000,
  "exp":      1700604800
}
```

> Le `JWT_SECRET` doit être **identique** dans auth-service et api-gateway.

---

## Tests

```bash
npm test
```

```
Test Suites: 5 passed
Tests:       14 passed
```

Suites : SignUpUseCase · LoginUseCase · CreateDriverUseCase · Email · Password

---

## MongoDB — Replica Set (Prisma 6)

Prisma 6 exige un replica set MongoDB pour toutes les opérations d'écriture.

```bash
# 1. Ajouter dans /etc/mongod.conf :
# replication:
#   replSetName: "rs0"

# 2. Redémarrer MongoDB
sudo systemctl restart mongod

# 3. Initialiser (une seule fois)
mongosh --eval "rs.initiate()"
```

DATABASE_URL doit inclure `?replicaSet=rs0&directConnection=true`.

---

## Tests API avec curl

```bash
# Health check
curl http://localhost:3000/health

# Inscription
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Secret123!","tenantId":"tenant-001"}'

# Connexion — récupère le token
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Secret123!"}' | jq -r '.token')

echo $TOKEN

# Logout (route protégée)
curl -X POST http://localhost:3000/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## Lien avec les autres services

| Service | Port | Interaction |
|---|---|---|
| API Gateway | 3006 | Valide les JWT émis ici sur chaque requête entrante |
| Notification | 3005 | Peut envoyer un email de bienvenue après inscription |
