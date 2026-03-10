# Contexte projet — Shipment Service

## Projet global : Camion Uber
Plateforme logistique B2B microservices.
Services : Auth, Company, Fleet, Shipment, Tracking, Notification.

## Ce service : Shipment Service (PORT 3002)
Gère les annonces de transport et le cycle de vie des expéditions.
Stack : Node.js 24, TypeScript, Express, Mongoose, MongoDB.

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
├── shipment/
│   ├── shipment.entity.ts      → interface Shipment extends BaseEntity
│   ├── shipment.model.ts       → schéma Mongoose
│   ├── shipment.repository.ts  → implements IRepository<Shipment>
│   ├── shipment.service.ts     → extends GenericService<Shipment>
│   └── shipment.controller.ts  → routes Express
├── config/
│   └── database.ts
├── middlewares/
│   └── error.middlewares.ts
└── app.ts
tests/
├── shipment.service.test.ts
└── shipment.repository.test.ts
```

## Lien avec les autres services
- **Fleet Service** (PORT 3003) : appelé via `GET /trucks/match` pour le matching de camions
- **Auth Service** : fournit `tenantId` dans le JWT (companyId ou transporterId)

## Workflow métier
```
POST /shipments        → statut PENDING
GET  /shipments/search → appelle fleet-service /trucks/match
POST /:id/accept       → statut ACCEPTED (lock atomique — évite race condition)
POST /:id/start        → statut IN_PROGRESS
POST /:id/deliver      → statut DELIVERED
DELETE /:id            → statut CANCELLED (soft delete)
```

## Règles importantes
- Soft delete UNIQUEMENT : DELETE passe le statut à CANCELLED, jamais de suppression physique
- `acceptIfPending()` : update atomique MongoDB — si deux transporteurs acceptent en même temps, seul le premier réussit
- `poids` est required car utilisé pour le matching avec fleet-service
- `villeDepart` + `paysDepart` définissent la zone géographique de l'annonce

## Statuts valides
PENDING → ACCEPTED → IN_PROGRESS → DELIVERED
PENDING → CANCELLED (annulation)

## Variables d'environnement
```
PORT=3002
MONGODB_URI=mongodb://localhost:27017/shipment-service
FLEET_SERVICE_URL=http://localhost:3003
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
