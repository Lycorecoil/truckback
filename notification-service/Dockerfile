# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Mise à jour des packages OS + Chromium requis par whatsapp-web.js (Puppeteer)
RUN apk update && apk upgrade --no-cache && apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Dossier de session WhatsApp (persisté via volume Docker)
RUN mkdir -p .wwebjs_auth/session && chown -R appuser:appgroup /app

USER appuser
ENV NODE_ENV=production
EXPOSE 3005
CMD ["node", "dist/main.js"]
