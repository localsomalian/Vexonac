# Build stage
FROM oven/bun:1.2.13-alpine AS builder

# Build-time public env vars (baked into the Next.js bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_WEB_APP_WEBSOCKET_URL
ARG NEXT_PUBLIC_INGRESS_API_URL
ARG NEXT_PUBLIC_INGRESS_API_WEBSOCKET_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_WEB_APP_WEBSOCKET_URL=$NEXT_PUBLIC_WEB_APP_WEBSOCKET_URL
ENV NEXT_PUBLIC_INGRESS_API_URL=$NEXT_PUBLIC_INGRESS_API_URL
ENV NEXT_PUBLIC_INGRESS_API_WEBSOCKET_URL=$NEXT_PUBLIC_INGRESS_API_WEBSOCKET_URL

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy workspace dependencies
COPY apps/web/package.json ./apps/web/
COPY apps/web/next.config.ts ./apps/web/
COPY packages/ ./packages/

# Copy server app for type imports (needed for tRPC client)
COPY apps/server/package.json ./apps/server/
COPY apps/server/src/ ./apps/server/src/
COPY apps/server/prisma/ ./apps/server/prisma/

# Install dependencies (skip postinstall to avoid prisma version conflicts)
RUN bun install --ignore-scripts

# Generate Prisma client with the pinned version
RUN cd packages/database && bunx prisma@6.9.0 generate --schema prisma/schema.prisma

# Copy source code
COPY apps/web/ ./apps/web/
COPY packages/ ./packages/

# Build the application
RUN bun run build --filter=web

# Production stage
FROM node:20-alpine AS runner

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone /app/apps/web/.next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static /app/apps/web/.next/standalone/apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public /app/apps/web/.next/standalone/apps/web/public

USER nextjs

WORKDIR /app/apps/web/.next/standalone/apps/web

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]