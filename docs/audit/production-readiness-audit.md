# Audit de Maturité Production — Camion-Uber

> **Date :** 2026-03-12
> **Auditeur :** Senior Staff Engineer
> **Branche :** `feat/sprint4-tracing-docs-hardening`
> **Périmètre :** 7 microservices + API Gateway + Nginx + CI/CD + Monitoring

---

## Score Global de Maturité Production

```text
┌─────────────────────────────────────────────────────────┐
│            SCORE GLOBAL :  6,1 / 10                     │
│            STATUT :        NON PRÊT POUR LA PRODUCTION  │
│            OBJECTIF :      > 7,0 / 10                   │
└─────────────────────────────────────────────────────────┘
```

| Domaine | Score | Statut |
| --- | --- | --- |
| 1. Sécurité | 7,5 / 10 | 🟡 Bon, lacunes à combler |
| 2. Journalisation & Monitoring | 8,0 / 10 | 🟢 Solide |
| 3. Communication inter-services | 4,0 / 10 | 🔴 Critique |
| 4. Fiabilité de la base de données | 4,5 / 10 | 🔴 Critique |
| 5. Résilience & Tolérance aux pannes | 5,0 / 10 | 🟠 Risque élevé |
| 6. Pipeline CI/CD | 6,5 / 10 | 🟡 Incomplet |
| 7. Déploiement | 7,0 / 10 | 🟡 Bon, lacunes à combler |
| 8. Qualité de l'API | 6,0 / 10 | 🟡 Incomplet |
| 9. Performance | 3,0 / 10 | 🔴 Critique |

---

## 🔴 Bloquants Critiques

Ces problèmes **doivent être résolus** avant tout déploiement en production.

### BC-1 · Absence de Circuit Breaker sur les appels HTTP inter-services

**Fichiers concernés :** `auth-service/src/infrastructure/clients/NotificationClient.ts`, `shipment-service/src/clients/NotificationClient.ts`, `tracking-service/src/clients/NotificationClient.ts`

Tous les appels HTTP vers les services aval sont effectués sans circuit breaker. Un `notification-service` dégradé bloquera tous les appelants pendant 5 s (timeout), et sous charge concurrente, cela épuise la boucle événementielle Node.js et provoque une panne en cascade sur l'ensemble du système.

**Constat :** `fetchWithTimeout` est utilisé dans auth et shipment, mais il n'existe aucun automate d'état de circuit, ni sonde half-open, ni stratégie de repli.

**Correction :** Envelopper tous les clients inter-services avec [`opossum`](https://nodeshift.dev/opossum/) :

```typescript
const breaker = new CircuitBreaker(fetchWithTimeout, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});
```

---

### BC-2 · Aucun Index Mongoose Défini dans le Code

**Fichiers concernés :** `auth-service/src/infrastructure/db/UserModel.ts` et tous les autres fichiers `*Model.ts`.

Les schémas Mongoose définissent `unique: true` sur `email` (ce qui crée un index simple), mais aucun index composé n'existe. Les requêtes filtrant par `tenantId` combiné à un autre champ effectuent des scans complets de la collection. À partir de 10 000 documents, cela devient un goulot d'étranglement ; à partir de 100 000, c'est une panne.

**Constat :** Aucun appel à `.index()` ou `schema.index()` n'a été trouvé dans le code.

**Correction :**

```typescript
UserSchema.index({ tenantId: 1, email: 1 });          // index composé
UserSchema.index({ tenantId: 1, role: 1 });
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
```

---

### BC-3 · Absence de File de Messages — Notifications Perdues en cas d'Échec

**Fichiers concernés :** Toutes les implémentations de `NotificationClient`.

Les appels fire-and-forget absorbent silencieusement les erreurs : seul un `console.error` est émis, et la notification est définitivement perdue. Il n'existe ni file morte (dead-letter queue), ni mécanisme de réessai, ni visibilité sur le nombre de notifications silencieusement ignorées. Aucune intégration BullMQ, RabbitMQ ou Redis Streams n'est présente.

**Correction :** Introduire une file BullMQ dans `notification-service`. Les producteurs poussent des jobs ; le worker retente avec un backoff exponentiel (3 tentatives, multiplicateur 2×, max 30 s).

---

### BC-4 · Aucun Test de Charge — Capacités Inconnues

**Fichiers concernés :** Inexistants (répertoire `load-tests/` absent).

Il n'existe aucun script k6, Artillery ou Locust dans le dépôt. Les plafonds de débit, la latence p99 sous charge et les seuils de saturation CPU/mémoire sont totalement inconnus. Les SLOs ne peuvent pas être validés.

**Correction :** Créer `load-tests/` avec des scripts k6 couvrant les chemins critiques : connexion, création d'expédition, mise à jour GPS.

---

## 🟠 Problèmes à Risque Élevé

Ces problèmes doivent être résolus dans le sprint suivant les bloquants critiques.

### RE-1 · Absence de Versionnage de l'API (préfixe `/v1`)

Toutes les routes sont montées à la racine (`/auth`, `/shipments`, etc.). Tout changement incompatible de l'API nécessite une bascule coordonnée de tous les clients, sans fenêtre de dépréciation.

**Correction :** Préfixer toutes les routes avec `/v1` dans `api-gateway/src/proxy/proxyRouter.ts` et mettre à jour `docs/openapi.yaml`.

---

### RE-2 · Absence de Réessai avec Backoff Exponentiel

`fetchWithTimeout` lève une exception dès le premier échec. Les erreurs transitoires (micro-coupure réseau, redémarrage d'un service en cours de déploiement) provoquent des échecs permanents au lieu de se résoudre automatiquement.

**Fichier concerné :** `shipment-service/src/utils/fetchWithTimeout.ts`

**Correction :** Ajouter un wrapper `retryWithBackoff` (3 tentatives, base 500 ms, multiplicateur 2×) autour de `fetchWithTimeout`.

---

### RE-3 · `tracking-service` NotificationClient Utilise `fetch()` Sans Timeout

**Fichier concerné :** `tracking-service/src/clients/NotificationClient.ts`

Contrairement aux services auth et shipment qui utilisent `fetchWithTimeout`, le service de tracking utilise le `fetch()` natif sans `AbortController`. Un `notification-service` lent peut bloquer indéfiniment un gestionnaire WebSocket.

**Correction :** Remplacer par `fetchWithTimeout(url, options, 5_000)` — déjà implémenté dans `shipment-service/src/utils/fetchWithTimeout.ts`, à copier et importer.

---

### RE-4 · Absence d'En-tête Content Security Policy (CSP)

Ni `nginx.conf` ni la configuration Helmet ne définissent un en-tête `Content-Security-Policy`. Sans CSP, une attaque XSS réussie ne rencontre aucune atténuation au niveau du navigateur.

**Fichiers concernés :** `nginx/nginx.conf`, `api-gateway/src/server.ts`

**Correction (Nginx) :**

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';" always;
```

**Correction (Helmet) :**

```typescript
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } } }));
```

---

### RE-5 · Les Secrets Docker ne Sont pas Utilisés en Production

`docker-compose.prod.yml` passe les secrets sous forme de variables d'environnement en clair. Tout `docker inspect` ou listing de processus expose toutes les valeurs secrètes.

**Fichier concerné :** `docker-compose.prod.yml`

**Correction :** Utiliser les secrets Docker Swarm ou un fichier `.env` exclu des layers de l'image. À terme : HashiCorp Vault ou AWS Secrets Manager.

---

### RE-6 · Absence d'ESLint et de Seuil de Couverture dans la CI

**Fichier concerné :** `.github/workflows/ci.yml`

Le pipeline CI exécute `npm test`, `tsc --noEmit`, le build Docker et `npm audit`, mais ne comporte ni étape de lint ni seuil de `--coverageThreshold`. Les régressions de style et les baisses de couverture passent inaperçues.

**Correction :** Ajouter l'étape `npm run lint` et `--coverageThreshold='{"global":{"lines":70}}'` à la commande de test.

---

## 🟡 Problèmes à Risque Moyen

### RM-1 · `JWT_REFRESH_SECRET` Utilise une Valeur de Repli Silencieuse

**Fichier :** `auth-service/src/infrastructure/services/JwtService.ts:11`

Si `JWT_REFRESH_SECRET` n'est pas défini, le constructeur utilise silencieusement `${JWT_SECRET}_refresh`. Un déploiement de production mal configuré se retrouve avec un secret de rafraîchissement prévisible sans échec au démarrage.

**Correction :** Rendre la variable obligatoire et lever une exception au démarrage si elle est absente.

---

### RM-2 · CORS avec Valeur Par Défaut `http://localhost:3000` en Production

**Fichier :** `api-gateway/src/server.ts`

Si `ALLOWED_ORIGINS` n'est pas défini, CORS accepte les requêtes depuis `http://localhost:3000` — une permissivité non intentionnelle en production.

**Correction :** Logger un avertissement ou lever une exception si `ALLOWED_ORIGINS` est absent quand `NODE_ENV=production`.

---

### RM-3 · Réponses d'Erreur Sans Code Machine-Lisible

Tous les services retournent `{ error: string }`. Les clients ne disposent d'aucun code machine-lisible pour distinguer « email déjà existant » de « mot de passe invalide » sans analyser le texte du message.

**Correction :** Ajouter un champ `code` standardisé : `{ error: string; code: string }` (ex. `AUTH_EMAIL_EXISTS`, `AUTH_INVALID_CREDENTIALS`).

---

### RM-4 · Absence de Traçage Distribué (OpenTelemetry / Jaeger)

La propagation du `X-Request-ID` via `AsyncLocalStorage` existe, mais il n'y a pas de contexte de trace (W3C `traceparent`) couvrant plusieurs services. Le débogage d'une requête multi-services nécessite une corrélation manuelle des logs.

**Correction :** Ajouter `@opentelemetry/sdk-node` avec l'exporteur Jaeger. L'infrastructure `requestContext` existante peut être étendue pour propager `traceId`/`spanId`.

---

### RM-5 · Aucune Stratégie de Sauvegarde de la Base de Données

Pas de cron `mongodump`, pas de référence à une politique de sauvegarde Atlas, et aucune documentation dans le dépôt.

**Correction :** Ajouter `docs/backup-strategy.md` et un script `scripts/backup-mongo.sh` exécutant `mongodump` et uploadant vers S3. Planifier via cron ou un workflow GitHub Actions.

---

### RM-6 · Absence de Limites CPU/Mémoire dans docker-compose

**Fichier :** `docker-compose.yml`

Aucun service ne définit `deploy.resources.limits`. Une fuite mémoire ou un pic CPU dans un service peut affamer tous les autres sur le même hôte.

**Correction :**

```yaml
deploy:
  resources:
    limits:
      cpus: '0.50'
      memory: 512M
```

---

### RM-7 · Absence de Déploiement Rolling ou Blue-Green

La configuration Docker Compose actuelle ne supporte pas les déploiements sans interruption de service. `docker compose up -d` provoque un bref temps d'arrêt à chaque redémarrage.

**Correction :** Implémenter les mises à jour rolling Docker Swarm (`update_config.parallelism: 1, order: start-first`) ou migrer vers Kubernetes.

---

## 🟢 Points Forts de l'Architecture

Les éléments suivants sont de qualité production et doivent servir d'implémentations de référence.

1. **Configuration TLS** — `nginx/nginx.conf` impose TLSv1.2+, HSTS avec max-age 2 ans et flag preload, tickets de session désactivés, suite de chiffrement ECDHE moderne. Conforme au profil Mozilla "Intermediate".

2. **Rate Limiting multi-couches** — Zones Nginx (10 req/min sur les routes auth, 100 req/min général) combinées avec `express-rate-limit` adossé à Redis dans l'API Gateway. Résiste aux redémarrages d'instances sans perte d'état des compteurs.

3. **bcrypt 12 rounds avec hachage asynchrone** — `auth-service/src/domain/value-objects/Password.ts` utilise bcrypt à 12 rounds (~250 ms par hachage), le pattern value-object garantit que les mots de passe ne sont jamais accidentellement loggés.

4. **Liste noire de révocation de tokens** — `LogoutUseCase` écrit les refresh tokens révoqués dans `IRevokedTokenRepository` avec nettoyage TTL. `RefreshTokenUseCase` vérifie la liste noire avant d'émettre. JWT sans état avec révocation avec état — le meilleur des deux approches.

5. **Arrêt gracieux sur les 7 services** — `gracefulShutdown.ts` gère SIGTERM/SIGINT, draine les requêtes en cours via `server.close()`, puis ferme MongoDB avec un kill forcé après 10 s.

6. **Stack complète Prometheus + Grafana + Alertmanager** — 6 règles d'alerte (ServiceDown, HighErrorRate, HighP99Latency, HighHeapUsage, FrequentRestarts), dashboard Grafana avec 8 panneaux, alertes email via Alertmanager. Rétention des métriques : 15 jours.

7. **Logs Pino structurés + X-Request-ID via AsyncLocalStorage** — JSON en production, lisible en développement. Les IDs de requête sont générés au niveau Nginx, propagés sur toute la chaîne d'appels et inclus dans chaque ligne de log.

8. **Documentation OpenAPI 3.0** — `docs/openapi.yaml` couvre les 30+ endpoints de tous les 7 services avec schémas de requête/réponse et sécurité Bearer.

9. **API Gateway à charge équilibrée (2 instances)** — Nginx `least_conn` avec `max_fails=3 fail_timeout=30s` en détection passive et pool keepalive de 32 connexions.

10. **Health checks sur chaque service** — `GET /health` retourne `{ status, db, uptime }` avec HTTP 200/503. Health checks Docker via `wget --spider` avec intervalle 15 s et 3 tentatives.

---

## Les 7 Contrôles Production les Plus Souvent Oubliés

Ces vérifications sont celles que les équipes expérimentées omettent le plus souvent et regrettent le plus.

| # | Contrôle | Statut dans ce projet |
| --- | --- | --- |
| 1 | **Circuit breakers** pour les appels vers les services aval | 🔴 Absent |
| 2 | **Index de base de données** (composés, TTL) | 🔴 Absent |
| 3 | **Versionnage de l'API** (`/v1`) avant le premier client externe | 🔴 Absent |
| 4 | **Tests de charge** avant la mise en production | 🔴 Absent |
| 5 | **En-tête Content Security Policy** | 🟠 Absent |
| 6 | **File de messages** pour les jobs asynchrones critiques | 🔴 Absent |
| 7 | **Stratégie de rotation des secrets** (Vault / Docker secrets) | 🟠 Partiel |

---

## Plan d'Action Priorisé

### Sprint 1 — Bloquants Critiques (P0) — Objectif : 7,5 / 10

> But : éliminer les risques de panne en cascade et garantir l'intégrité des données à l'échelle.

| # | Action | Fichier(s) | Effort |
| --- | --- | --- | --- |
| 1.1 | Ajouter le circuit breaker `opossum` sur tous les clients HTTP inter-services | `*/src/clients/NotificationClient.ts` | M |
| 1.2 | Définir les index Mongoose composés : `{ tenantId, email }`, `{ tenantId, role }`, TTL sur `RevokedToken` | Tous les `*Model.ts` | S |
| 1.3 | Corriger le `NotificationClient` du tracking-service : remplacer `fetch()` par `fetchWithTimeout(5000)` | `tracking-service/src/clients/NotificationClient.ts` | XS |
| 1.4 | Ajouter l'étape ESLint dans GitHub Actions CI | `.github/workflows/ci.yml` | S |
| 1.5 | Imposer le seuil de couverture 70 % (lignes) dans la CI | `.github/workflows/ci.yml` + fichiers `jest.config.ts` | S |
| 1.6 | Créer des tests de charge k6 pour le login et la création d'expédition | `load-tests/login.js`, `load-tests/shipment.js` | M |

> Score attendu après le Sprint 1 : **7,5 / 10**

---

### Sprint 2 — Risques Élevés (P1) — Objectif : 8,5 / 10

> But : durcir la couche de communication, ajouter le versionnage et sécuriser le pipeline de livraison.

| # | Action | Fichier(s) | Effort |
| --- | --- | --- | --- |
| 2.1 | Ajouter le préfixe `/v1` sur toutes les routes + mettre à jour la spec OpenAPI | `api-gateway/src/proxy/proxyRouter.ts`, `docs/openapi.yaml` | M |
| 2.2 | Ajouter le réessai avec backoff exponentiel à `fetchWithTimeout` (3 tentatives, base 500 ms, 2×) | `shipment-service/src/utils/fetchWithTimeout.ts` | S |
| 2.3 | Implémenter la file BullMQ dans `notification-service` | `notification-service/src/infrastructure/queue/` | L |
| 2.4 | Ajouter l'en-tête `Content-Security-Policy` dans `nginx.conf` et Helmet | `nginx/nginx.conf`, `api-gateway/src/server.ts` | XS |
| 2.5 | Migrer les secrets de production vers les secrets Docker | `docker-compose.prod.yml` | M |
| 2.6 | Publier le rapport de couverture HTML en artefact CI | `.github/workflows/ci.yml` | XS |

> Score attendu après le Sprint 2 : **8,5 / 10**

---

### Sprint 3 — Risques Moyens (P2) — Objectif : 9,0 / 10

> But : observabilité complète, déploiements sans interruption et hygiène opérationnelle long terme.

| # | Action | Fichier(s) | Effort |
| --- | --- | --- | --- |
| 3.1 | Intégrer OpenTelemetry SDK + exporteur Jaeger sur tous les services | `*/src/utils/tracing.ts` | L |
| 3.2 | Ajouter `deploy.resources.limits` (0,5 CPU, 512 Mo) dans docker-compose pour tous les services | `docker-compose.yml` | S |
| 3.3 | Documenter et automatiser la sauvegarde MongoDB (mongodump + S3) | `docs/backup-strategy.md`, `scripts/backup-mongo.sh` | M |
| 3.4 | Ajouter le champ `code` d'erreur dans tous les middlewares d'erreur | `*/src/middleware/error*.ts` | S |
| 3.5 | Rendre `JWT_REFRESH_SECRET` obligatoire (exception au démarrage si absent) | `auth-service/src/infrastructure/services/JwtService.ts` | XS |
| 3.6 | Implémenter la configuration de mise à jour rolling Docker Swarm | `docker-compose.prod.yml` | M |

> Score attendu après le Sprint 3 : **9,0 / 10**

---

## Annexe — Carte des Fichiers Critiques

| Domaine | Fichiers Critiques |
| --- | --- |
| JWT & tokens | `auth-service/src/infrastructure/services/JwtService.ts` |
| Révocation de token | `auth-service/src/application/use-cases/LogoutUseCase.ts` |
| Hachage des mots de passe | `auth-service/src/domain/value-objects/Password.ts` |
| HTTP inter-services | `shipment-service/src/utils/fetchWithTimeout.ts` |
| Clients notification | `*/src/clients/NotificationClient.ts` (3 services) |
| Auth API Gateway | `api-gateway/src/middleware/authMiddleware.ts` |
| CORS/Helmet Gateway | `api-gateway/src/server.ts` |
| TLS + en-têtes Nginx | `nginx/nginx.conf` |
| Rate limiting Nginx | `nginx/nginx.dev.conf` |
| Pipeline CI/CD | `.github/workflows/ci.yml` |
| Config Prometheus | `monitoring/prometheus.yml` |
| Règles d'alerte | `monitoring/alerts.yml` |
| Dashboard Grafana | `monitoring/grafana/dashboards/services-overview.json` |
| Spec OpenAPI | `docs/openapi.yaml` |
| Docker Compose (dev) | `docker-compose.yml` |
| Docker Compose (prod) | `docker-compose.prod.yml` |

---

Rapport généré le 2026-03-12 — Camion-Uber feat/sprint4-tracing-docs-hardening
