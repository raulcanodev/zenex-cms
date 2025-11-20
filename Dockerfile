# Dockerfile optimizado para Next.js en Dokploy
# Evita que se acumulen capas innecesarias

FROM node:20-alpine AS base

# 1. Instalar dependencias (solo cuando package.json cambia)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
# Si existe package-lock.json usa npm ci, sino npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 2. Build de la aplicación
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno necesarias para el build
ENV NEXT_TELEMETRY_DISABLED=1

# Generar Prisma Client
RUN npx prisma generate

# Build de Next.js (genera .next/standalone)
RUN npm run build

# 3. Imagen final de producción (la más pequeña posible)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando que corre la app
CMD ["node", "server.js"]
