# Contexte projet — Tracking Service

## Projet global : Camion Uber
Plateforme logistique B2B microservices.
Services : Auth, Company, Fleet, Shipment, Tracking, Notification.

## Ce service : Tracking Service (PORT 3004 HTTP / PORT 3005 WebSocket)
Gère les positions GPS des camions en temps réel pendant les expéditions.
Stack : Node.js 24, TypeScript, Express, Mongoose, MongoDB, ws (WebSocket).

## Package générique utilisé
- Nom : @jb226/generic-service
- npm : https://www.npmjs.com/package/@jb226/generic-service
- GitHub : https://github.com/Lycorecoil/Generic-Service-Package

## Ce que fait le package
- GenericService<T> : logique CRUD complète
- IRepository<T> : contrat à implémenter avec Mongoose
- Erreurs typées : NotFoundError (404), ConflictError (409), ValidationError (400)
- Types : PaginatedResult<T>, QueryOptions, ServiceResponse<T>
- Utils : paginate(), buildFilters()
- BaseEntity = { id: string } (UUID)

## Architecture du service
Feature-based Layered Architecture + Ports & Adapters

```
src/
├── tracking/
│   ├── tracking.entity.ts      → interface TrackingPoint extends BaseEntity
│   ├── tracking.model.ts       → schéma Mongoose
│   ├── tracking.repository.ts  → implements IRepository<TrackingPoint>
│   ├── tracking.service.ts     → extends GenericService<TrackingPoint>
│   └── tracking.controller.ts  → routes Express
├── config/
│   └── database.ts
├── middlewares/
│   └── error.middlewares.ts
└── app.ts
tests/
├── tracking.service.test.ts
└── tracking.repository.test.ts
```

## Entité TrackingPoint
```typescript
{
  id: string          // UUID
  truckId: string     // ID du camion
  shipmentId: string  // ID de l'expédition en cours
  latitude: number
  longitude: number
  vitesse?: number    // km/h (optionnel)
  timestamp: Date     // moment de la prise de position
  createdAt: Date
  updatedAt: Date
}
```

## Routes HTTP
```
POST /tracking                          → envoyer une position GPS (crée un TrackingPoint)
GET  /tracking/truck/:truckId           → dernière position connue d'un camion
GET  /tracking/truck/:truckId/history   → historique complet des positions d'un camion
GET  /tracking/shipment/:shipmentId     → tous les points d'une expédition
```

## WebSocket (PORT 3005)
- Connexion : `ws://localhost:3005`
- À chaque nouveau point GPS (POST /tracking), le service diffuse à tous les clients connectés :
  ```json
  { "type": "tracking:update", "data": { ...TrackingPoint } }
  ```
- Utilisation : application mobile chauffeur / dashboard entreprise

## Lien avec les autres services
- **Fleet Service** (PORT 3003) : les `truckId` référencent des camions du fleet-service
- **Shipment Service** (PORT 3002) : les `shipmentId` référencent des expéditions

## Pas de soft delete ici
Les points de tracking sont des données historiques — ils ne sont jamais supprimés (la méthode `delete()` est un no-op).

## Variables d'environnement
```
PORT=3004
WS_PORT=3005
MONGODB_URI=mongodb://localhost:27017/tracking-service
```

## Patterns validés (identiques aux autres services)
- `returnDocument: "after"` (pas `new: true`)
- `req.params["id"] as string` (pas `!`)
- `import "dotenv/config"` en première ligne de app.ts
- Middleware d'erreurs en dernier dans app.ts
- Routes spécifiques AVANT `/:id`

## Préférences de travail
- Réponses en français
- Approche pédagogique : expliquer, écrire 1 exemple, laisser faire le reste
- Avancer étape par étape
