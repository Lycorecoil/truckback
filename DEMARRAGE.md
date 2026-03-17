# Guide de démarrage — Camion Uber (Elimmekatruck)

## Avant de démarrer

### 1. Configurer le fichier `.env`

Copier `.env.example` en `.env` si besoin, puis remplir les valeurs :

```
# MongoDB — changer en prod
MONGO_ROOT_PASSWORD=root1234fornow

# JWT RS256 — générer une nouvelle paire :
#   node -e "const {generateKeyPairSync}=require('crypto'); const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'pkcs1',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}); console.log('PRIVATE=',privateKey.replace(/\n/g,'\\n')); console.log('PUBLIC=',publicKey.replace(/\n/g,'\\n'));"
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...

# Gmail — App Password requis (Compte Google → Sécurité → Mots de passe des applications)
SMTP_USER=ton.email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=ton.email@gmail.com

# Grafana
GRAFANA_PASSWORD=mot_de_passe_fort
```

---

## Démarrage complet (première fois ou reset)

```bash
# 1. Lancer toute la stack
docker-compose up -d

# 2. Vérifier que tous les services sont healthy (attendre ~60s)
docker-compose ps

# 3. Connecter WhatsApp (voir section ci-dessous)
```

---

## Connecter WhatsApp (obligatoire au premier démarrage)

WhatsApp-web.js nécessite un scan QR unique. La session est ensuite sauvegardée.

### Étape 1 — Attendre que Chromium génère le QR (~30s après démarrage)

```bash
docker logs -f notification-service 2>&1 | grep '"qr"'
```

### Étape 2 — Générer l'image PNG du QR sur le Bureau

```bash
QR=$(docker logs notification-service 2>&1 | grep '"qr"' | tail -1 | sed 's/.*"qr":"\([^"]*\)".*/\1/') && docker exec notification-service node -e "require('qrcode').toFile('/tmp/whatsapp-qr.png','$QR',{width:400},()=>{})" && docker cp notification-service:/tmp/whatsapp-qr.png C:/Users/Jean-Baptiste/Desktop/whatsapp-qr.png && echo "QR sur le Bureau !"
```

> Le module `qrcode` doit être installé dans le container. Si absent :
> ```bash
> docker exec --user root notification-service npm install qrcode --no-save
> ```
> Puis relancer la commande ci-dessus.

### Étape 3 — Scanner avec WhatsApp

Ouvrir `whatsapp-qr.png` sur le Bureau → scanner avec WhatsApp :
**⋮ → Appareils liés → Scanner un QR code**

> Le QR expire toutes les ~20 secondes. Si expiré, relancer l'Étape 2.

### Étape 4 — Vérifier la connexion

```bash
docker logs notification-service 2>&1 | grep "prêt"
# Résultat attendu : "[notification-service][WhatsApp] Client prêt — session active"
```

La session est persistée dans le volume Docker `whatsapp_session`. Plus besoin de scanner aux prochains redémarrages.

---

## Redémarrage normal (stack déjà configurée)

```bash
docker-compose up -d
```

WhatsApp se reconnecte automatiquement via la session sauvegardée.

---

## Redémarrage d'un seul service

```bash
docker-compose restart notification-service
docker-compose restart auth-service
# etc.
```

---

## Reset complet (supprime toutes les données)

```bash
docker-compose down -v
docker-compose up -d
# Puis re-scanner le QR WhatsApp
```

---

## Accès aux interfaces

| Interface | URL | Credentials |
|---|---|---|
| API | http://localhost:80 | JWT |
| Swagger / Docs | http://localhost:80/v1/docs | — |
| Grafana | http://localhost:3008 | admin / `GRAFANA_PASSWORD` |
| Jaeger (traces) | http://localhost:16686 | — |
| Prometheus | http://localhost:9090 | — |

---

## Déploiement en production (avec TLS)

### Prérequis
- Un domaine DNS pointant vers le serveur
- Ports 80 et 443 ouverts

### Obtenir le certificat Let's Encrypt

```bash
# 1. Lancer la stack prod (sans HTTPS d'abord pour le challenge ACME)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 2. Obtenir le certificat (remplacer DOMAINE et EMAIL)
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d VOTRE_DOMAINE \
  --email VOTRE_EMAIL \
  --agree-tos --no-eff-email

# 3. Mettre à jour nginx.conf : remplacer "DOMAIN" par votre domaine
# Ligne : ssl_certificate /etc/letsencrypt/live/DOMAIN/fullchain.pem;

# 4. Redémarrer Nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

Le certificat se renouvelle automatiquement toutes les 12h via le container `certbot`.

---

## Dépannage

### WhatsApp ne se connecte pas après restart
```bash
# Vérifier les logs
docker logs notification-service 2>&1 | tail -20

# Si erreur SingletonLock (ne devrait plus arriver) :
docker exec --user root notification-service rm -f /app/.wwebjs_auth/session/Singleton*
docker restart notification-service
```

### MongoDB ne démarre pas
```bash
docker logs elimmekatruck-mongo 2>&1 | tail -20
# Vérifier MONGO_ROOT_PASSWORD dans .env
```

### Email non envoyé (erreur 535)
```bash
# Vérifier les credentials SMTP dans .env
# Gmail : utiliser un App Password (pas le mot de passe normal)
# Compte Google → Sécurité → Mots de passe des applications
docker-compose up -d --no-build notification-service  # redémarre avec les nouvelles vars
```

### Voir les logs d'un service
```bash
docker logs -f <nom-service>
# Exemples : notification-service, auth-service, shipment-service
```
