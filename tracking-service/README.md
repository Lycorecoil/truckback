# Tracking Service

Microservice de **suivi GPS en temps réel** des camions pendant les expéditions pour la plateforme **Camion Uber**.

---

## Rôle

Ce service reçoit les positions GPS envoyées par les chauffeurs et les diffuse en temps réel via **WebSocket** aux clients connectés (dashboard entreprise, application mobile).

---

## Stack

- **Runtime** : Node.js 24
- **Langage** : TypeScript
- **Framework** : Express 5
- **Base de données** : MongoDB via Mongoose 9
- **WebSocket** : `ws`
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
| `PORT` | Port HTTP | `3004` |
| `WS_PORT` | Port WebSocket | `3005` |
| `MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/tracking-service` |

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Démarre en mode développement (hot reload) |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npm start` | Démarre le build compilé |
| `npm test` | Lance tous les tests (12 tests) |

---

## Architecture

```
src/
├── tracking/
│   ├── tracking.entity.ts      → Interface TrackingPoint (domaine)
│   ├── tracking.model.ts       → Schéma Mongoose
│   ├── tracking.repository.ts  → IRepository<TrackingPoint> + méthodes métier
│   ├── tracking.service.ts     → GenericService<TrackingPoint> + broadcast WS
│   └── tracking.controller.ts  → Routes Express
├── config/
│   └── database.ts
├── middlewares/
│   └── error.middlewares.ts
└── app.ts                      → HTTP + WebSocket server
tests/
├── tracking.service.test.ts    → 6 tests unitaires
└── tracking.repository.test.ts → 6 tests intégration
```

---

## API HTTP

Base URL : `http://localhost:3004`

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/tracking` | Envoyer une position GPS |
| `GET` | `/tracking/truck/:truckId` | Dernière position connue d'un camion |
| `GET` | `/tracking/truck/:truckId/history` | Historique complet des positions d'un camion |
| `GET` | `/tracking/shipment/:shipmentId` | Tous les points d'une expédition |

### Body — `POST /tracking`

```json
{
  "truckId": "uuid-camion",
  "shipmentId": "uuid-expedition",
  "latitude": 6.3654,
  "longitude": 2.4183,
  "vitesse": 65
}
```

- `truckId`, `shipmentId`, `latitude`, `longitude` sont **requis**
- `vitesse` (km/h) est **optionnel**

---

## WebSocket

**URL** : `ws://localhost:3005`

### Connexion

```javascript
const ws = new WebSocket("ws://localhost:3005");

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // msg.type === "tracking:update"
  // msg.data === TrackingPoint
};
```

### Message diffusé à chaque nouvelle position

```json
{
  "type": "tracking:update",
  "data": {
    "id": "uuid",
    "truckId": "uuid-camion",
    "shipmentId": "uuid-expedition",
    "latitude": 6.3654,
    "longitude": 2.4183,
    "vitesse": 65,
    "timestamp": "2025-06-15T08:05:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Tous les clients WebSocket connectés reçoivent le message à chaque `POST /tracking`.

---

## Modèle de données

### TrackingPoint

```typescript
{
  id: string;          // UUID
  truckId: string;     // ID du camion (Fleet Service)
  shipmentId: string;  // ID de l'expédition (Shipment Service)
  latitude: number;
  longitude: number;
  vitesse?: number;    // km/h
  timestamp: Date;     // Moment de la prise de position
  createdAt: Date;
  updatedAt: Date;
}
```

> Les points de tracking sont des **données historiques** — ils ne sont jamais supprimés.

---

## Tests

```bash
npm test
```

```
Test Suites: 2 passed
Tests:       12 passed
```

---

## Lien avec les autres services

| Service | Interaction |
|---|---|
| **Fleet Service** | Les `truckId` référencent des camions du Fleet Service |
| **Shipment Service** | Les `shipmentId` référencent des expéditions — le tracking démarre quand le statut passe à `IN_PROGRESS` |
