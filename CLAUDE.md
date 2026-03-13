# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Camion Uber (Elimmekatruck)** — B2B logistics platform matching transporters/fleet operators with companies needing shipments. Seven independent Node.js/TypeScript microservices behind an API Gateway, with a full observability stack.

Each service has its own `CLAUDE.md` with service-specific architectural guidance — read it first before modifying a service.

---

## Commands

All commands run from within the relevant service directory (no root-level scripts).

**Start the full stack:**
```bash
docker-compose up -d
```

**Develop a single service:**
```bash
cd <service-name>
npm run dev          # ts-node + dotenv watch mode
npm run build        # compile TypeScript → dist/
```

**Run tests:**
```bash
cd <service-name>
npm test                                   # all tests
npm test -- path/to/file.test.ts           # single file
npm test -- --testNamePattern="<pattern>"  # by name
npm test -- --runInBand --forceExit        # required for shipment/fleet/company (mongodb-memory-server)
npm run test:coverage
```

Jest uses `ts-jest`, matches `**/tests/**/*.test.ts`, 30s timeout per test.

---

## Service Map

| Service | Port | Role |
|---|---|---|
| `api-gateway` | 3006 | JWT validation, rate limiting, reverse proxy |
| `auth-service` | 3000 | Register/login, JWT issuance |
| `company-service` | 3001 | Organizations & transporter profiles |
| `fleet-service` | 3003 | Trucks & drivers |
| `shipment-service` | 3002 | Shipment lifecycle & truck matching |
| `tracking-service` | 3004 (HTTP) / 3007 (WS) | GPS tracking & real-time updates |
| `notification-service` | 3005 | Email (nodemailer) / SMS (Twilio) via BullMQ |

**Request path:** Client → Nginx (port 80) → API Gateway (×2 instances) → Services → MongoDB 7 (replica set `rs0`) + Redis 7.

---

## Architecture Patterns

There are **two distinct architectural styles** in use:

### 1. Clean Architecture — `auth-service`, `notification-service`
- Layers: `domain/` → `application/use-cases/` → `infrastructure/`
- Manual constructor-based dependency injection (no DI framework)
- `container.ts` wires all dependencies at startup
- `notification-service` uses Port/Adapter pattern: providers (`IEmailProvider`, `ISmsProvider`) are injected, allowing swap without business logic changes

### 2. Feature-based Layered — `company-service`, `fleet-service`, `shipment-service`, `tracking-service`
- Each domain entity lives in its own folder: `entity → repository → service → controller → router`
- All extend `@jb226/generic-service` npm package which provides `IRepository<T>` and `GenericService<T>` base classes
- `api-gateway` is purely a middleware chain with no business logic

### API Gateway middleware order (do not reorder)
`helmet → cors → morgan → rate-limit → /health → authMiddleware → proxyRouter → 404`

The gateway injects `x-user-id`, `x-user-role`, `x-tenant-id` headers into proxied requests. Downstream services must read identity from these headers, not the JWT directly.

---

## Codebase-wide Conventions

These apply across all services:

- **Env vars:** always `process.env['KEY']` (bracket notation, never dot notation)
- **UUIDs:** `crypto.randomUUID()` — do not add the `uuid` package
- **MongoDB updates:** use `returnDocument: "after"` on `findOneAndUpdate` (not `new: true`)
- **Express 5 params:** `req.params["id"] as string` (not `!` bang operator)
- **Error handling:** catch at service layer → set status to `FAILED`, return gracefully — do not throw from service methods
- **Config validation:** throw at startup if required env vars are missing (fail-fast)
- **Soft deletes:** change `status` field (e.g. `SUSPENDED`, `CANCELLED`) — never physically delete historical records
- **Graceful shutdown:** register `SIGTERM`/`SIGINT` handlers to close DB connections and drain queues

---

## Infrastructure

**MongoDB 7** runs as a replica set (`rs0`) initialized by the `mongodb-init` one-shot container. Mongoose (not Prisma) is the ORM.

**Redis 7** serves two purposes: shared rate limiting store for the API Gateway, and BullMQ backend for the notification queue.

**OpenTelemetry traces** are exported to Jaeger (port 4318). Each service initializes a tracer at startup before any other import.

**Prometheus** scrapes `/metrics` from all services every 15s via `prom-client`.

**Production deployment** uses `docker-compose.prod.yml` with resource limits and Nginx TLS termination. Scale api-gateway with `./scripts/scale.sh api-gateway <replicas>`.
