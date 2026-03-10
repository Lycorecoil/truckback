# Contexte projet — Company Service

## Projet global : Camion Uber
Plateforme logistique B2B microservices.
Services : Auth, Company, Fleet, Shipment, Tracking, Notification.

## Ce service : Company Service
Gère les entreprises clientes et les transporteurs.
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

## Architecture du service
Feature-based Layered Architecture + Ports & Adapters

```
src/
├── company/
│   ├── company.entity.ts       → interface Company extends BaseEntity
│   ├── company.repository.ts   → implements IRepository<Company> avec Mongoose
│   ├── company.service.ts      → extends GenericService<Company>
│   └── company.controller.ts   → routes Express
├── transporter/
│   ├── transporter.entity.ts
│   ├── transporter.repository.ts
│   ├── transporter.service.ts
│   └── transporter.controller.ts
├── config/
│   └── database.ts             → connexion MongoDB
├── middlewares/
│   └── error.middleware.ts     → gestion globale des erreurs
└── app.ts                      → serveur Express
```

## Entités
Company     : id, name, email, address, phone, siret, createdAt
Transporter : id, name, email, address, phone, siret, createdAt

## Flux de données
Request → Controller → Service (GenericService) → Repository (Mongoose) → MongoDB

## Préférences de travail
- Réponses en français
- Approche pédagogique : expliquer, écrire 1 exemple, laisser faire le reste
- Avancer étape par étape
