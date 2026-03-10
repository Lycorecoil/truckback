# Shipment Service

Microservice de gestion des **annonces de transport** et du **cycle de vie des expéditions** pour la plateforme **Camion Uber**.

---

## Rôle

Ce service permet aux **expéditeurs** (COMPANY) de publier des annonces de transport, et aux **transporteurs** d'accepter ces missions.  
Il orchestre le workflow complet d'une expédition de `PENDING` à `DELIVERED`.

---

## Stack

- **Runtime** : Node.js 24
- **Langage** : TypeScript
- **Framework** : Express 5
- **Base de données** : MongoDB via Mongoose 9
- **Package métier** : `@jb226/generic-service`
- **Communication inter-service** : `fetch()` natif Node.js 24

---

## Installation

```bash
npm install
```

## Variables d'environnement

Créer un fichier `.env` à la racine :

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port HTTP du service | `3002` |
| `MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/shipment-service` |
| `FLEET_SERVICE_URL` | URL du Fleet Service | `http://localhost:3003` |

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Démarre en mode développement (hot reload) |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npm start` | Démarre le build compilé |
| `npm test` | Lance tous les tests |

---

## Architecture

```
src/
├── shipment/
│   ├── shipment.entity.ts      → Interface Shipment (domaine)
│   ├── shipment.model.ts       → Schéma Mongoose
│   ├── shipment.repository.ts  → IRepository<Shipment> + acceptIfPending()
│   ├── shipment.service.ts     → GenericService<Shipment> + searchMatchingTrucks()
│   └── shipment.controller.ts  → Routes Express
├── config/
│   └── database.ts
├── middlewares/
│   └── error.middlewares.ts
└── app.ts
tests/
├── shipment.service.test.ts    → Tests unitaires (repository mocké)
└── shipment.repository.test.ts → Tests intégration (MongoDB en mémoire)
```

---

## API

Base URL : `http://localhost:3002`

### 📦 Expéditions — `/shipments`

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/shipments` | Créer une annonce (statut → `PENDING`) |
| `GET` | `/shipments/search` | Chercher des camions compatibles (via Fleet Service) |
| `GET` | `/shipments` | Lister les annonces (filtrable par `companyId`, `transporterId`, `statut`) |
| `GET` | `/shipments/:id` | Détail d'une annonce |
| `PUT` | `/shipments/:id` | Modifier une annonce |
| `POST` | `/shipments/:id/accept` | Transporteur accepte la mission (statut → `ACCEPTED`) |
| `POST` | `/shipments/:id/start` | Chauffeur démarre la mission (statut → `IN_PROGRESS`) |
| `POST` | `/shipments/:id/deliver` | Livraison terminée (statut → `DELIVERED`) |
| `DELETE` | `/shipments/:id` | Annuler — soft delete (statut → `CANCELLED`) |

#### Query params — `GET /shipments/search`

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `poids` | number | ✅ | Poids de la marchandise en kg |
| `villeDepart` | string | ✅ | Ville de départ |
| `paysDepart` | string | ✅ | Pays de départ |
| `typeVehicule` | string | ❌ | Type de véhicule souhaité |

#### Body — `POST /shipments/:id/accept`

```json
{
  "transporterId": "uuid-transporteur",
  "truckId": "uuid-camion",
  "driverId": "uuid-chauffeur"
}
```

---

## Workflow métier

```
POST /shipments        → statut PENDING  (annonce publiée)
GET  /shipments/search → appelle Fleet Service /trucks/match
POST /:id/accept       → statut ACCEPTED (lock atomique — anti race condition)
POST /:id/start        → statut IN_PROGRESS
POST /:id/deliver      → statut DELIVERED
DELETE /:id            → statut CANCELLED (soft delete, depuis PENDING uniquement)
```

### Anti race condition sur l'acceptation

Deux transporteurs peuvent tenter d'accepter la même annonce simultanément.  
Le service utilise un `findOneAndUpdate` atomique MongoDB avec filtre `{ id, statut: "PENDING" }` :  
seul le premier transporteur dont la requête trouve le statut `PENDING` réussit. Le second reçoit une erreur 409.

---

## Modèle de données

### Shipment

```typescript
{
  id: string;                   // UUID
  companyId: string;            // Expéditeur
  transporterId?: string;       // Transporteur assigné (après acceptation)
  truckId?: string;             // Camion assigné
  driverId?: string;            // Chauffeur assigné
  dateAnnonce: Date;
  heureAnnonce: string;         // Format HH:mm
  marchandise: string;
  emballage?: string;
  quantite: number;
  poids: number;                // kg — requis pour le matching
  paysDepart: string;
  villeDepart: string;
  paysArrivee: string;
  villeArrivee: string;
  geolocDepart?: { latitude: number; longitude: number };
  geolocArrivee?: { latitude: number; longitude: number };
  prixTransport?: number;
  statut: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";
  commentaireGeneral?: string;
  commentaireAnnulation?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Tests

```bash
npm test
```

---

## Lien avec les autres services

| Service | Interaction |
|---|---|
| **Auth Service** | Fournit `companyId` / `transporterId` dans le JWT |
| **Fleet Service** | `GET /trucks/match` — recherche des camions compatibles |
| **Tracking Service** | Utilise `shipmentId` pour enregistrer les positions GPS |
