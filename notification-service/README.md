# Notification Service

Microservice de **notifications multicanal** pour la plateforme **Camion Uber**.

---

## Rôle

Ce service envoie des notifications **EMAIL**, **SMS** et **PUSH** déclenchées par les autres microservices lors d'événements métier (changement de statut d'expédition, bienvenue, alertes chauffeur). Les providers sont des stubs en MVP — les vrais providers (SendGrid, Twilio, FCM) sont prévus pour les sprints suivants.

---

## Stack

- **Runtime** : Node.js 18
- **Langage** : TypeScript strict
- **Framework** : Express.js
- **Base de données** : MongoDB via Prisma 6 (replica set obligatoire)
- **Tests** : Jest + ts-jest (TDD)

---

## Installation

```bash
NODE_ENV=development npm install
npx prisma generate
```

---

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port HTTP | `3005` |
| `DATABASE_URL` | URI MongoDB avec replica set | `mongodb://localhost:27017/camion-uber-notifications?replicaSet=rs0&directConnection=true` |
| `NODE_ENV` | Environnement | `development` |

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Démarre en mode développement (ts-node + dotenv) |
| `npm test` | Lance tous les tests (10 tests, 5 suites) |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npx prisma generate` | Régénère le client Prisma après changement de schema |

---

## Architecture

```
src/
├── domain/
│   ├── entities/Notification.ts          → NotificationChannel, NotificationStatus, Notification
│   └── repositories/INotificationRepository.ts
├── application/
│   ├── ports/
│   │   ├── IEmailProvider.ts             → interface du canal email
│   │   ├── ISmsProvider.ts               → interface du canal SMS
│   │   └── IPushProvider.ts              → interface du canal push
│   ├── dtos/                             → SendEmailDTO, SendSmsDTO, SendPushDTO…
│   └── use-cases/                        → 1 use case par canal + GetUserNotifications + CreateTemplate
└── infrastructure/
    ├── config/container.ts               → Composition root (DI manuelle)
    ├── http/
    │   ├── server.ts
    │   ├── router.ts
    │   ├── controllers/NotificationController.ts
    │   └── middleware/errorMiddleware.ts
    ├── providers/
    │   ├── NodemailerEmailProvider.ts    → Stub MVP (console.log)
    │   ├── StubSmsProvider.ts            → Stub MVP (console.log)
    │   └── StubPushProvider.ts           → Stub MVP (console.log)
    └── repositories/PrismaNotificationRepository.ts
```

---

## Modèles de données

### Notification

```typescript
enum NotificationChannel { EMAIL = 'EMAIL', SMS = 'SMS', PUSH = 'PUSH' }
enum NotificationStatus  { SENT = 'SENT', FAILED = 'FAILED' }

interface Notification {
  id:          string;               // ObjectId MongoDB
  recipientId: string;               // userId (UUID) de auth-service
  channel:     NotificationChannel;
  message:     string;
  status:      NotificationStatus;   // FAILED si le provider a échoué
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
  body:     string;               // Peut contenir des variables {{prenom}}
}
```

---

## API HTTP

Base URL : `http://localhost:3005`

### GET /health

```json
{ "status": "ok", "service": "notification-service" }
```

---

### POST /notification/email

**Body :**

```json
{
  "recipientId": "user-uuid-1234",
  "to":          "destinataire@example.com",
  "subject":     "Votre livraison est en route",
  "message":     "Bonjour, votre camion a pris la route."
}
```

Champs requis : `recipientId`, `to`, `subject`, `message`

**Réponse 201 :**

```json
{
  "id":          "64b1c2d3e4f5a6b7c8d9e0f1",
  "recipientId": "user-uuid-1234",
  "channel":     "EMAIL",
  "status":      "SENT"
}
```

> Si le provider échoue, `status` vaut `"FAILED"` mais la réponse est quand même `201`.

---

### POST /notification/sms

**Body :**

```json
{
  "recipientId": "user-uuid-1234",
  "to":          "+33612345678",
  "message":     "Votre chauffeur arrive dans 10 minutes."
}
```

Champs requis : `recipientId`, `to`, `message`

**Réponse 201 :**

```json
{
  "id":          "64b1c2d3e4f5a6b7c8d9e0f2",
  "recipientId": "user-uuid-1234",
  "channel":     "SMS",
  "status":      "SENT"
}
```

---

### POST /notification/push

**Body :**

```json
{
  "recipientId": "user-uuid-1234",
  "deviceToken": "fcm-device-token-abc123",
  "title":       "Nouvelle livraison disponible",
  "message":     "Un camion est disponible près de vous."
}
```

Champs requis : `recipientId`, `deviceToken`, `title`, `message`

**Réponse 201 :**

```json
{
  "id":          "64b1c2d3e4f5a6b7c8d9e0f3",
  "recipientId": "user-uuid-1234",
  "channel":     "PUSH",
  "status":      "SENT"
}
```

---

### GET /notification/:userId

Historique des notifications d'un utilisateur.

**Réponse 200 :**

```json
[
  {
    "id":          "64b1c2d3e4f5a6b7c8d9e0f1",
    "recipientId": "user-uuid-1234",
    "channel":     "EMAIL",
    "message":     "Votre livraison est en route",
    "status":      "SENT",
    "createdAt":   "2025-06-15T08:05:00.000Z"
  }
]
```

---

### POST /notification/template

**Body :**

```json
{
  "name":    "bienvenue-email",
  "channel": "EMAIL",
  "subject": "Bienvenue sur Camion Uber",
  "body":    "Bonjour {{prenom}}, bienvenue sur notre plateforme !"
}
```

`subject` est optionnel (pertinent uniquement pour `channel: "EMAIL"`).

**Réponse 201 :**

```json
{
  "id":      "64b1c2d3e4f5a6b7c8d9e0f4",
  "name":    "bienvenue-email",
  "channel": "EMAIL"
}
```

---

## Tests

```bash
npm test
```

```
Test Suites: 5 passed
Tests:       10 passed
```

Suites : SendEmailUseCase · SendSmsUseCase · SendPushUseCase · GetUserNotificationsUseCase · CreateTemplateUseCase

---

## Providers — MVP vs Production

| Canal | MVP (actuel) | Production (à implémenter) |
|---|---|---|
| Email | `NodemailerEmailProvider` — `console.log` | SendGrid / Resend |
| SMS | `StubSmsProvider` — `console.log` | Twilio |
| Push | `StubPushProvider` — `console.log` | Firebase Cloud Messaging (FCM) |

Pour substituer un provider : créer une classe qui implémente `IEmailProvider` (ou `ISmsProvider`/`IPushProvider`) et la brancher dans `container.ts`. Aucun autre fichier ne change.

---

## Tests API avec curl

```bash
# Health check
curl http://localhost:3005/health

# Envoyer un email
curl -X POST http://localhost:3005/notification/email \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"user-123","to":"test@test.com","subject":"Test","message":"Hello"}'

# Historique d'un utilisateur
curl http://localhost:3005/notification/user-123
```

---

## Lien avec les autres services

| Service | Port | Interaction |
|---|---|---|
| API Gateway | 3006 | Toutes les routes sont proxiées via `/notification/*` |
| Auth | 3000 | Les `recipientId` sont des userId créés dans auth-service |
| Shipment | 3003 | Déclenche des notifications lors des changements de statut |
