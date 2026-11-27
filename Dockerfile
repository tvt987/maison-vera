# ==============================================================================
# MAISON VÉRA v5.0 — Frontend Production Multi-Stage Dockerfile
# Stage 1: Node 22 build (TypeScript + Vite Rollup code-splitting)
# Stage 2: Nginx 1.27 Alpine (Strict CSP + API reverse proxy + immutable assets)
# ==============================================================================

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vitest.config.ts ./
COPY public ./public
COPY src ./src

RUN npm test && npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
