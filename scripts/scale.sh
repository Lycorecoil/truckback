#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# scale.sh — Scaler un microservice Elimmekatruck
# Usage : ./scripts/scale.sh <service> <instances>
# Exemples :
#   ./scripts/scale.sh shipment-service 3
#   ./scripts/scale.sh fleet-service 2
# ─────────────────────────────────────────────────────────────────────────────
# NOTE : Seul l'api-gateway bénéficie du load balancing Nginx automatique
# (api-gateway-1 et api-gateway-2 sont définis explicitement).
# Pour les autres services, Docker interne résout par round-robin DNS.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SERVICE="${1:-}"
REPLICAS="${2:-2}"

if [ -z "$SERVICE" ]; then
    echo "Usage: $0 <service> <replicas>"
    echo "Services disponibles: auth-service, company-service, fleet-service,"
    echo "                      shipment-service, tracking-service, notification-service"
    exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "📈 Scaling $SERVICE → $REPLICAS instances..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d \
    --scale "$SERVICE=$REPLICAS" \
    --no-recreate \
    "$SERVICE"

echo "✅ $SERVICE scaled to $REPLICAS instances"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps "$SERVICE"
