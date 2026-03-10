# Company Service

Microservice de gestion des organisations (expéditeurs et transporteurs) pour la plateforme **Camion Uber**.

---

## Rôle

Ce service gère les **profils métier** des organisations qui utilisent la plateforme.  
Il ne gère **pas** l'authentification — c'est le rôle du **Auth Service**.

| Type | Description |
|---|---|
| `COMPANY` | Expéditeur — entreprise qui a des marchandises à envoyer |
| `TRANSPORTER` | Transporteur — entreprise qui achemine les marchandises |

Le lien entre les deux services se fait via le `tenantId` présent dans le JWT Auth.

---

## Stack

- **Runtime** : Node.js 24
- **Langage** : TypeScript
- **Framework** : Express 5
- **Base de données** : MongoDB via Mongoose
- **Package métier** : `@jb226/generic-service`

---

## Installation

```bash
npm install
```

## Variables d'environnement

Copier `.env.example` en `.env` et remplir les valeurs :

```bash
cp .env.example .env
```

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port du serveur | `3001` |
| `MONGO_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/company-service` |

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Démarre en mode développement (hot reload) |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npm start` | Démarre le build compilé |
| `npm test` | Lance tous les tests |
| `npm run test:watch` | Tests en mode watch |

---

## Architecture

```
src/
├── organization/
│   ├── organization.entity.ts       → Interface TypeScript (domaine)
│   ├── organization.model.ts        → Schéma Mongoose (infrastructure)
│   ├── organization.repository.ts   → Implémente IRepository<Organization>
│   ├── organization.service.ts      → Étend GenericService<Organization>
│   └── organization.controller.ts   → Routes Express (factory par type)
├── config/
│   └── database.ts                  → Connexion MongoDB
├── middlewares/
│   └── error.middlewares.ts         → Gestion globale des erreurs
└── app.ts                           → Serveur Express
tests/
├── organization.service.test.ts     → Tests unitaires (repository mocké)
└── organization.repository.test.ts  → Tests intégration (MongoDB en mémoire)
```

### Flux de données

```
Request → Controller → Service (GenericService) → Repository (Mongoose) → MongoDB
```

---

## API

Base URL : `http://localhost:3001`

### 🏢 Entreprises — `/company`

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/company` | Liste paginée des entreprises |
| `GET` | `/company/:id` | Récupérer une entreprise par UUID |
| `GET` | `/company/tenant/:tenantId` | Récupérer par tenantId (lien Auth) |
| `POST` | `/company` | Créer une entreprise |
| `PUT` | `/company/:id` | Modifier le profil |
| `DELETE` | `/company/:id` | Suspendre une entreprise (soft delete → `statut: SUSPENDED`) |

### 🚛 Transporteurs — `/transporter`

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/transporter` | Liste paginée des transporteurs |
| `GET` | `/transporter/:id` | Récupérer un transporteur par UUID |
| `GET` | `/transporter/tenant/:tenantId` | Récupérer par tenantId (lien Auth) |
| `POST` | `/transporter` | Créer un transporteur |
| `PUT` | `/transporter/:id` | Modifier le profil |
| `DELETE` | `/transporter/:id` | Suspendre un transporteur (soft delete → `statut: SUSPENDED`) |

### Query params (GET liste)

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `page` | number | `1` | Numéro de page |
| `limit` | number | `10` | Éléments par page |
| `sortBy` | string | `createdAt` | Champ de tri |
| `sortOrder` | `asc` \| `desc` | `desc` | Ordre de tri |

---

## Modèle de données

### Organization

```typescript
{
  id: string;              // UUID (généré automatiquement)
  tenantId: string;        // Lien avec Auth Service (unique)
  type: "COMPANY" | "TRANSPORTER";
  statut?: "ACTIVE" | "SUSPENDED";  // ACTIVE par défaut

  // Informations légales
  raisonSociale: string;
  formeJuridique: string;
  rccm: string;
  ifu: string;
  secteurActivite: string;

  // Localisation
  pays: string;
  ville: string;
  boitePostale?: string;

  // Contact société
  email: string;
  telephone: string;

  // Représentant légal
  nomRepresentant: string;
  prenomRepresentant: string;
  fonctionRepresentant: string;
  emailRepresentant: string;
  telephoneRepresentant: string;

  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Exemple de réponse (création)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "tenant-abc-123",
    "type": "COMPANY",
    "statut": "ACTIVE",
    "raisonSociale": "ACME Bénin Sarl",
    "formeJuridique": "SARL",
    "rccm": "RB/COT/24-B-12345",
    "ifu": "3202400012345",
    "secteurActivite": "Commerce général",
    "pays": "Bénin",
    "ville": "Cotonou",
    "boitePostale": "BP 1234",
    "email": "contact@acme-benin.bj",
    "telephone": "+22961000001",
    "nomRepresentant": "Adjovi",
    "prenomRepresentant": "Kofi",
    "fonctionRepresentant": "Directeur Général",
    "emailRepresentant": "kofi.adjovi@acme-benin.bj",
    "telephoneRepresentant": "+22961000002",
    "createdAt": "2026-03-10T08:00:00.000Z",
    "updatedAt": "2026-03-10T08:00:00.000Z"
  }
}
```

### Exemple de réponse (liste paginée)

```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Erreurs

```json
{ "success": false, "error": "Resource not found", "code": 404 }
{ "success": false, "error": "Conflict", "code": 409 }
{ "success": false, "error": "Validation error", "code": 400 }
{ "success": false, "error": "Erreur interne du serveur.", "code": 500 }
```

---

## Tests

```bash
npm test
```

- `organization.service.test.ts` — tests unitaires, repository mocké, aucune DB requise
- `organization.repository.test.ts` — tests intégration, MongoDB en mémoire via `mongodb-memory-server`

```
Test Suites: 2 passed
Tests:       22 passed
```

---

## Lien avec les autres services

| Service | Interaction |
|---|---|
| **Auth Service** | Fournit le `tenantId` dans le JWT — Company Service l'utilise pour lier un profil à un compte |
| **Fleet Service** | Utilise le `tenantId` du transporteur pour associer les véhicules |
| **Shipment Service** | Référence les IDs d'organisations pour créer des expéditions |
