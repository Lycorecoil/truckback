# Fleet Service

Microservice de gestion de la **flotte** (camions et chauffeurs) pour la plateforme **Camion Uber**.

---

## Rôle

Ce service gère les **camions** et les **chauffeurs** appartenant aux transporteurs.  
Il expose également un endpoint de **matching** utilisé par le Shipment Service pour trouver les camions disponibles compatibles avec une annonce.

---

## Stack

- **Runtime** : Node.js 24
- **Langage** : TypeScript
- **Framework** : Express 5
- **Base de données** : MongoDB via Mongoose 9
- **Package métier** : `@jb226/generic-service`

---

## Installation

```bash
npm install
```

## Variables d'environnement

Créer un fichier `.env` à la racine :

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port HTTP du service | `3003` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/fleet-service` |

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Démarre en mode développement (hot reload) |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npm start` | Démarre le build compilé |
| `npm test` | Lance tous les tests (23 tests) |

---

## Architecture

```
src/
├── truck/
│   ├── truck.entity.ts         → Interface Truck (domaine)
│   ├── truck.model.ts          → Schéma Mongoose
│   ├── truck.repository.ts     → IRepository<Truck> + findMatching()
│   ├── truck.service.ts        → GenericService<Truck> + findMatching()
│   └── truck.controller.ts     → Routes Express
├── driver/
│   ├── driver.entity.ts
│   ├── driver.model.ts
│   ├── driver.repository.ts
│   ├── driver.service.ts
│   └── driver.controller.ts
├── config/
│   └── database.ts
├── middlewares/
│   └── error.middlewares.ts
└── app.ts
tests/
├── truck.service.test.ts       → 7 tests unitaires
├── truck.repository.test.ts    → 7 tests intégration
├── driver.service.test.ts      → 5 tests unitaires
└── driver.repository.test.ts   → 4 tests intégration
```

---

## API

Base URL : `http://localhost:3003`

### 🚛 Camions — `/trucks`

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/trucks` | Créer un camion (`statut: AVAILABLE` par défaut) |
| `GET` | `/trucks` | Liste paginée de tous les camions |
| `GET` | `/trucks/match` | **Matching** — camions compatibles avec une annonce |
| `GET` | `/trucks/:id` | Détail d'un camion par UUID |
| `PUT` | `/trucks/:id` | Modifier un camion |
| `POST` | `/trucks/assign-driver` | Assigner un chauffeur (statut → `BUSY`) |
| `DELETE` | `/trucks/:id` | Soft delete (statut → `MAINTENANCE`) |

#### Query params — `GET /trucks/match`

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `poids` | number | ✅ | Poids de la marchandise en kg |
| `villeDepart` | string | ✅ | Ville de départ de l'annonce |
| `paysDepart` | string | ✅ | Pays de départ de l'annonce |
| `typeVehicule` | string | ❌ | Filtre optionnel (ex: `BENNE`, `PLATEAU`) |

#### Query params — `GET /trucks`

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `page` | number | `1` | Numéro de page |
| `limit` | number | `10` | Éléments par page |
| `tenantId` | string | — | Filtrer par transporteur |
| `available` | boolean | — | `true` = camions AVAILABLE seulement |

### 👤 Chauffeurs — `/drivers`

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/drivers` | Créer un chauffeur (`statut: AVAILABLE` par défaut) |
| `GET` | `/drivers` | Liste paginée |
| `GET` | `/drivers/:id` | Détail par UUID |
| `PUT` | `/drivers/:id` | Modifier |
| `DELETE` | `/drivers/:id` | Soft delete (statut → `SUSPENDED`) |

---

## Modèles de données

### Truck

```typescript
{
  id: string;              // UUID
  tenantId: string;        // ID du transporteur propriétaire
  immatriculation: string; // Plaque unique
  chassis: string;         // Numéro de châssis unique
  marque: string;
  modele: string;
  typeVehicule: string;    // Ex: BENNE, PLATEAU, CITERNE...
  carrosserie?: string;
  gabarit?: string;
  capaciteMax: number;     // kg — utilisé pour le matching
  photoUrl?: string;
  statut: "AVAILABLE" | "BUSY" | "MAINTENANCE";
  driverId?: string;       // UUID du chauffeur assigné
  villeBase: string;       // Ville habituelle du camion — utilisée pour le matching
  paysBase: string;        // Pays — utilisé pour le matching
  createdAt: Date;
  updatedAt: Date;
}
```

### Driver

```typescript
{
  id: string;
  tenantId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numeroPermis: string;
  statut: "AVAILABLE" | "BUSY" | "SUSPENDED";
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Logique de matching

Le matching (`GET /trucks/match`) filtre les camions selon :
- `statut = AVAILABLE`
- `capaciteMax >= poids` (camion assez grand pour la charge)
- `villeBase = villeDepart` (camion basé dans la même ville)
- `paysBase = paysDepart` (même pays)
- `typeVehicule = typeVehicule` (si fourni)

---

## Tests

```bash
npm test
```

```
Test Suites: 4 passed
Tests:       23 passed
```

---

## Lien avec les autres services

| Service | Interaction |
|---|---|
| **Auth Service** | Fournit le `tenantId` dans le JWT |
| **Shipment Service** | Appelle `GET /trucks/match` pour trouver les camions compatibles avec une annonce |
| **Tracking Service** | Utilise les `truckId` pour enregistrer les positions GPS |
