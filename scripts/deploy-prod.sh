#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-prod.sh — Déploiement production Elimmekatruck
# Usage : ./scripts/deploy-prod.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "═══════════════════════════════════════════════════════════"
echo "  Elimmekatruck — Déploiement Production"
echo "═══════════════════════════════════════════════════════════"

# 1. Vérification des prérequis
command -v docker         >/dev/null || { echo "❌ docker manquant"; exit 1; }
command -v docker-compose >/dev/null || command -v "docker compose" >/dev/null || { echo "❌ docker-compose manquant"; exit 1; }
command -v openssl        >/dev/null || { echo "❌ openssl manquant"; exit 1; }

# 2. Vérification du .env
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env manquant — copier .env.example et renseigner les valeurs"
    exit 1
fi

# Vérification des variables critiques
for VAR in JWT_SECRET JWT_REFRESH_SECRET SMTP_USER SMTP_PASS; do
    VAL=$(grep "^${VAR}=" .env | cut -d= -f2-)
    if [ -z "$VAL" ]; then
        echo "❌ Variable $VAR manquante ou vide dans .env"
        exit 1
    fi
done
echo "✅ Variables d'environnement vérifiées"

# 3. Certificats SSL
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo "🔐 Génération des certificats SSL..."
    bash scripts/generate-certs.sh
fi
echo "✅ Certificats SSL présents"

# 4. Build de toutes les images
echo ""
echo "🔨 Build des images Docker..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# 5. Démarrage avec healthchecks
echo ""
echo "🚀 Démarrage des services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# 6. Attendre que MongoDB soit healthy
echo "⏳ Attente MongoDB..."
for i in {1..30}; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' elimmekatruck-mongo 2>/dev/null || echo "unknown")
    [ "$STATUS" = "healthy" ] && break
    echo "   MongoDB: $STATUS ($i/30)..."
    sleep 3
done

# 7. Vérification des services
echo ""
echo "🔍 Statut des services :"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 8. Test HTTPS
echo ""
echo "🔒 Test HTTPS (certificat auto-signé — ignorer l'erreur cert en dev) :"
curl -sk https://localhost/health | python3 -m json.tool 2>/dev/null || \
curl -sk https://localhost/health || echo "⚠️  Test HTTPS échoué — vérifier nginx"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Déploiement terminé !"
echo "  API Gateway : https://localhost"
echo "  Logs Nginx  : docker logs nginx -f"
echo "  Logs tout   : docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "═══════════════════════════════════════════════════════════"
