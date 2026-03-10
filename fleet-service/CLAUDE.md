# Contexte projet — Fleet Service

## Projet global : Camion Uber
Plateforme logistique B2B microservices.
Services : Auth, Company, Fleet, Shipment, Tracking, Notification.

## Ce service : Fleet Service
Gère les camions et les chauffeurs appartenant aux transporteurs.
Stack : Node.js 24, TypeScript, Express, Mongoose, MongoDB.

## Package générique utilisé
- Nom : @jb226/generic-service
- npm : https://www.npmjs.com/package/@jb226/generic-service
- GitHub : https://github.com/Lycorecoil/Generic-Service-Package
- Installation : npm install @jb226/generic-service

## Ce que fait le package
- GenericService<T> : logique CRUD complète
- IRepository<T> : contrat à implémenter avec Mongoose
- Erreurs typées : NotFoundError (404), ConflictError (409), ValidationError (400)
- Types : PaginatedResult<T>, QueryOptions, ServiceResponse<T>
- Utils : paginate(), buildFilters()
- BaseEntity = { id: string } (UUID)

### Interface IRepository<T> (méthodes à implémenter)
```typescript
findById(id: string): Promise<T | null>
findAll(options: QueryOptions): Promise<PaginatedResult<T>>
create(data: Omit<T, "id">): Promise<T>
update(id: string, data: Partial<T>): Promise<T>
delete(id: string): Promise<void>
exists(id: string): Promise<boolean>
```

### QueryOptions
```typescript
{ page: number, limit: number, sortBy?: string, sortOrder?: "asc"|"desc", filters?: Record<string, unknown> }
```

## Architecture du service
Feature-based Layered Architecture + Ports & Adapters

```
src/
├── truck/
│   ├── truck.entity.ts         → interface Truck extends BaseEntity
│   ├── truck.model.ts          → schéma Mongoose
│   ├── truck.repository.ts     → implements IRepository<Truck>
│   ├── truck.service.ts        → extends GenericService<Truck>
│   └── truck.controller.ts     → routes Express
├── driver/
│   ├── driver.entity.ts
│   ├── driver.model.ts
│   ├── driver.repository.ts
│   ├── driver.service.ts
│   └── driver.controller.ts
├── config/
│   └── database.ts             → connexion MongoDB
├── middlewares/
│   └── error.middlewares.ts    → gestion globale des erreurs (noter le "s" final)
└── app.ts                      → serveur Express
tests/
├── truck.service.test.ts       → tests unitaires (repository mocké)
├── truck.repository.test.ts    → tests intégration (mongodb-memory-server)
├── driver.service.test.ts
└── driver.repository.test.ts
```

## Lien avec les autres services

- **Auth Service** : fournit `tenantId` dans le JWT. Les drivers ont un compte Auth (role: DRIVER).
- **Company Service** : les trucks et drivers appartiennent à un transporteur identifié par `tenantId` (role: TRANSPORTER).
- Chaque Truck et Driver doit stocker `tenantId` pour lier à l'organisation transporteur.

## Entités (à affiner selon le cahier des charges)
```
Truck  : id (UUID), tenantId, immatriculation, marque, modele, capacite, statut (AVAILABLE|BUSY|MAINTENANCE), createdAt, updatedAt
Driver : id (UUID), tenantId, nom, prenom, email, telephone, numeroPermis, statut (AVAILABLE|BUSY|SUSPENDED), createdAt, updatedAt
```
- `statut` doit être un soft delete (SUSPENDED) — ne jamais supprimer physiquement.
- `id` = UUID string généré avec `randomUUID()` dans le repository, PAS l'ObjectId MongoDB.

## Flux de données
Request → Controller → Service (GenericService) → Repository (Mongoose) → MongoDB

## Patterns validés dans Company Service (à réutiliser tels quels)

### 1. Soft delete dans le controller
```typescript
// DELETE /:id → ne supprime pas, suspend
router.delete("/:id", async (req, res, next) => {
  const result = await service.updateOne(req.params["id"] as string, { statut: "SUSPENDED" });
  res.json(result);
});
```

### 2. Fix Mongoose findOneAndUpdate (deprecation warning)
```typescript
// Utiliser returnDocument: "after" et NON new: true
OrganizationModel.findOneAndUpdate({ id }, { $set: data }, { returnDocument: "after" })
```

### 3. Fix TypeScript strict sur req.params (Express 5)
```typescript
// Utiliser "as string" et NON "!"
req.params["id"] as string   // ✅
req.params["id"]!            // ❌ erreur TS avec @types/express 5+
```

### 4. Fix TypeScript strict sur toJSON transform
```typescript
transform: (_doc, ret: Record<string, unknown>) => {
  delete ret["_id"];   // ✅
  delete ret["__v"];
}
```

### 5. Chargement dotenv dans app.ts
```typescript
import "dotenv/config"; // toujours en première ligne
import express from "express";
```

### 6. Config Jest dans package.json
```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/tests/**/*.test.ts"],
  "testTimeout": 30000
}
```
Script : `"test": "jest --runInBand"` (séquentiel, nécessaire pour mongodb-memory-server)

### 7. Middleware d'erreurs — toujours déclaré EN DERNIER dans app.ts
```typescript
app.use("/trucks", truckRouter);
app.use("/drivers", driverRouter);
app.use(errorMiddleware); // en dernier
```

### 8. Route /tenant/:tenantId avant /:id (conflit Express)
```typescript
router.get("/tenant/:tenantId", ...); // AVANT /:id
router.get("/:id", ...);
```

## Préférences de travail
- Réponses en français
- Approche pédagogique : expliquer, écrire 1 exemple, laisser faire le reste
- Avancer étape par étape
