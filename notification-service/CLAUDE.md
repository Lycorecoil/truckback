# notification-service — Instructions pour Claude

## Projet global : Camion Uber

Plateforme logistique B2B microservices — mise en relation transporteurs et entreprises.
Services : Auth (3000), Company (3001), Fleet (3002), Shipment (3003), Tracking (3004), Notification (3005), API Gateway (3006).

## Ce service : Notification Service (PORT 3005)

Gère l'envoi de notifications multicanal (EMAIL, SMS, PUSH) déclenchées par les autres services lors d'événements métier (changement de statut d'expédition, bienvenue, alertes chauffeur).

Stack : Node.js 18, TypeScript strict, Express.js, Prisma 6, MongoDB (replica set), Jest + ts-jest.

## Architecture — Clean Architecture

```
src/
├── domain/
│   ├── entities/Notification.ts          # NotificationChannel, NotificationStatus, Notification class
│   └── repositories/INotificationRepository.ts
├── application/
│   ├── ports/
│   │   ├── IEmailProvider.ts
│   │   ├── ISmsProvider.ts
│   │   └── IPushProvider.ts
│   ├── dtos/                             # SendEmailDTO, SendSmsDTO, SendPushDTO, CreateTemplateDTO
│   └── use-cases/
│       ├── SendEmailUseCase.ts
│       ├── SendSmsUseCase.ts
│       ├── SendPushUseCase.ts
│       ├── GetUserNotificationsUseCase.ts
│       └── CreateTemplateUseCase.ts
└── infrastructure/
    ├── config/container.ts               # Composition root
    ├── http/
    │   ├── server.ts
    │   ├── router.ts
    │   ├── controllers/NotificationController.ts
    │   └── middleware/errorMiddleware.ts
    ├── providers/
    │   ├── NodemailerEmailProvider.ts    # Stub MVP (console.log)
    │   ├── StubSmsProvider.ts            # Stub MVP (console.log)
    │   └── StubPushProvider.ts           # Stub MVP (console.log)
    └── repositories/PrismaNotificationRepository.ts
```

## Entités

### Notification

```typescript
enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS   = 'SMS',
  PUSH  = 'PUSH',
}

enum NotificationStatus {
  SENT   = 'SENT',
  FAILED = 'FAILED',
}

interface Notification {
  id:          string;               // ObjectId MongoDB
  recipientId: string;               // userId de auth-service
  channel:     NotificationChannel;
  message:     string;
  status:      NotificationStatus;
  createdAt:   Date;
}
```

### NotificationTemplate

```typescript
interface NotificationTemplate {
  id:       string;
  name:     string;               // Unique
  channel:  NotificationChannel;
  subject?: string;               // Email uniquement
  body:     string;
}
```

## Patterns validés

- **Résilience** : si le provider lève une exception, le use case attrape l'erreur, sauvegarde la notification avec `status: FAILED` et retourne quand même — **jamais de `throw` vers le controller**
- `recipientId` = `userId` UUID provenant de auth-service — ce n'est pas un email
- **Substituer un provider** → modifier uniquement `container.ts` (pas les use cases)
- Les interfaces `IEmailProvider`, `ISmsProvider`, `IPushProvider` vivent dans `application/ports/` — jamais dans infra
- `process.env['KEY']` bracket notation obligatoire
- `NODE_ENV=development npm install` obligatoire
- DI manuelle par constructeur dans `container.ts`

## Variables d'environnement requises

```
PORT=3005
DATABASE_URL=mongodb://localhost:27017/camion-uber-notifications?replicaSet=rs0&directConnection=true
NODE_ENV=development
```

## Commandes

```bash
npm run dev      # ts-node + dotenv
npm test         # jest — 10 tests, 5 suites
npm run build    # tsc → dist/
npx tsc --noEmit
npx prisma generate
```

## Endpoints

| Méthode | Route | Description | Status |
|---|---|---|---|
| GET | `/health` | Healthcheck | 200 |
| POST | `/notification/email` | Envoyer un email | 201 |
| POST | `/notification/sms` | Envoyer un SMS | 201 |
| POST | `/notification/push` | Envoyer une notification push | 201 |
| GET | `/notification/:userId` | Historique d'un utilisateur | 200 |
| POST | `/notification/template` | Créer un template | 201 |

## Ajouter un vrai provider (exemple SendGrid)

1. Installer `@sendgrid/mail`
2. Créer `SendgridEmailProvider.ts` qui implémente `IEmailProvider`
3. Remplacer `NodemailerEmailProvider` dans `container.ts`
4. Ajouter `SENDGRID_API_KEY` dans `.env`

Les use cases et le reste du code **ne changent pas** — c'est l'intérêt du pattern Port/Adapter.

## Lien avec les autres services

| Service | Port | Interaction |
|---|---|---|
| API Gateway | 3006 | Toutes les routes sont proxiées via `/notification/*` |
| Auth | 3000 | Les `recipientId` sont des userId créés dans auth-service |
| Shipment | 3003 | Déclenche des notifications lors des changements de statut |

## Préférences de travail

- Réponses en français
- Approche TDD : Red → Green → Refactor
- Approche pédagogique : expliquer avant d'écrire
- Avancer étape par étape
