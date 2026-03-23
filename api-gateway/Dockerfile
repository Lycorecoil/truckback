# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
RUN apk update && apk upgrade --no-cache
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

USER appuser
ENV NODE_ENV=production
EXPOSE 3006
CMD ["node", "dist/main.js"]
