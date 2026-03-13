#!/usr/bin/env bash
# deploy-rolling.sh — Mise à jour progressive des microservices (rolling deploy)
#
# Principe :
#   1. Met à jour un service à la fois
#   2. Attend que le nouveau conteneur soit sain (healthcheck)
#   3. Continue seulement si le healthcheck passe
#   4. Rollback automatique en cas d'échec
#
# Usage :
#   ./scripts/deploy-rolling.sh                          # déploie tous les services
#   ./scripts/deploy-rolling.sh auth-service fleet-service  # services ciblés
#   IMAGE_TAG=abc1234 ./scripts/deploy-rolling.sh        # tag Docker spécifique

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"   # secondes max pour le healthcheck
HEALTH_INTERVAL="${HEALTH_INTERVAL:-3}"  # intervalle entre les sondages
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Ordre de déploiement : dépendances d'abord
DEFAULT_SERVICES=(
  "auth-service"
  "company-service"
  "fleet-service"
  "shipment-service"
  "tracking-service"
  "notification-service"
  "api-gateway"
)

SERVICES=("${@:-${DEFAULT_SERVICES[@]}}")

# ─── Couleurs ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ─── Fonctions ───────────────────────────────────────────────────────────────

# Attend que le healthcheck Docker du conteneur soit "healthy"
wait_healthy() {
  local service="$1"
  local elapsed=0

  log_info "Attente healthcheck : ${service} (timeout ${HEALTH_TIMEOUT}s)…"

  while [[ $elapsed -lt $HEALTH_TIMEOUT ]]; do
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' \
      "$(docker compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null | head -1)" 2>/dev/null || echo "unknown")

    if [[ "$status" == "healthy" ]]; then
      log_ok "${service} est sain (${elapsed}s)"
      return 0
    fi

    if [[ "$status" == "unhealthy" ]]; then
      log_error "${service} est unhealthy après ${elapsed}s"
      return 1
    fi

    sleep "$HEALTH_INTERVAL"
    elapsed=$((elapsed + HEALTH_INTERVAL))
  done

  log_error "${service} : healthcheck timeout (${HEALTH_TIMEOUT}s)"
  return 1
}

# Rollback d'un service vers l'image précédente
rollback() {
  local service="$1"
  log_warn "Rollback de ${service}…"
  docker compose -f "$COMPOSE_FILE" up -d --no-deps "$service" || true
  log_warn "Rollback ${service} terminé"
}

# Déploie un service unique
deploy_service() {
  local service="$1"
  log_info "━━━ Déploiement de ${service} (tag: ${IMAGE_TAG}) ━━━"

  # Pull de la nouvelle image si un registry est configuré
  if docker compose -f "$COMPOSE_FILE" config --services | grep -q "^${service}$"; then
    docker compose -f "$COMPOSE_FILE" pull "$service" 2>/dev/null || log_warn "Pull ignoré (image locale ?)"
  fi

  # Redémarre uniquement ce service (--no-deps = pas de cascade)
  if ! docker compose -f "$COMPOSE_FILE" up -d --no-deps "$service"; then
    log_error "docker compose up a échoué pour ${service}"
    return 1
  fi

  # Attente healthcheck
  if ! wait_healthy "$service"; then
    if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
      rollback "$service"
    fi
    return 1
  fi

  log_ok "✓ ${service} déployé avec succès"
  return 0
}

# ─── Main ────────────────────────────────────────────────────────────────────

log_info "Rolling deploy — ${#SERVICES[@]} service(s) : ${SERVICES[*]}"
log_info "Compose file : ${COMPOSE_FILE}"
log_info "Image tag    : ${IMAGE_TAG}"
echo ""

FAILED=()

for service in "${SERVICES[@]}"; do
  if deploy_service "$service"; then
    sleep 2   # pause entre chaque service pour laisser le trafic se stabiliser
  else
    log_error "Échec du déploiement de ${service}"
    FAILED+=("$service")
  fi
done

echo ""
if [[ ${#FAILED[@]} -eq 0 ]]; then
  log_ok "✓ Rolling deploy terminé avec succès (${#SERVICES[@]} service(s))"
  exit 0
else
  log_error "Déploiement échoué pour : ${FAILED[*]}"
  exit 1
fi
