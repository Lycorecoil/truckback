#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# generate-certs.sh
# Génère des certificats auto-signés pour le développement local.
# En production, utiliser Certbot (Let's Encrypt) — voir ci-dessous.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SSL_DIR="$(dirname "$0")/../nginx/ssl"
mkdir -p "$SSL_DIR"

echo "Génération d'un certificat auto-signé (2048-bit RSA, valable 365 jours)..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/key.pem" \
  -out    "$SSL_DIR/cert.pem" \
  -subj   "/C=BJ/ST=Littoral/L=Cotonou/O=Elimmekatruck/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo "✅ Certificats générés dans $SSL_DIR"
echo "   cert.pem — certificat public"
echo "   key.pem  — clé privée (NE PAS committer)"

# ─────────────────────────────────────────────────────────────────────────────
# PRODUCTION — Let's Encrypt avec Certbot
# ─────────────────────────────────────────────────────────────────────────────
# 1. Installer Certbot sur le serveur :
#    sudo apt install certbot
#
# 2. Générer le certificat (DNS doit pointer vers votre IP) :
#    sudo certbot certonly --standalone -d votre-domaine.com
#
# 3. Les certificats sont dans :
#    /etc/letsencrypt/live/votre-domaine.com/fullchain.pem
#    /etc/letsencrypt/live/votre-domaine.com/privkey.pem
#
# 4. Monter dans docker-compose.prod.yml :
#    volumes:
#      - /etc/letsencrypt:/etc/letsencrypt:ro
#
# 5. Dans nginx.conf, remplacer :
#    ssl_certificate     /etc/nginx/ssl/cert.pem;
#    ssl_certificate_key /etc/nginx/ssl/key.pem;
#    par :
#    ssl_certificate     /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
#    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
#
# 6. Renouvellement automatique (crontab) :
#    0 3 * * * certbot renew --quiet && docker exec nginx nginx -s reload
