# Build stage
FROM oven/bun:1.2.13-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy workspace dependencies
COPY apps/ingress-api/package.json ./apps/ingress-api/
COPY packages/ ./packages/

# Install dependencies (skip postinstall to avoid prisma version conflicts)
RUN bun install --ignore-scripts

# Generate Prisma client with the pinned version
RUN cd packages/database && bunx prisma@6.9.0 generate --schema prisma/schema.prisma

# Copy source code
COPY apps/ingress-api/ ./apps/ingress-api/
COPY packages/ ./packages/

# Build the application
RUN bun run build --filter=ingress-api

# Production stage
FROM oven/bun:1.2.13-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ingressuser

# Copy built application
COPY --from=builder --chown=ingressuser:nodejs /app/apps/ingress-api/dist /app/apps/ingress-api/dist
COPY --from=builder --chown=ingressuser:nodejs /app/apps/ingress-api/assets /app/apps/ingress-api/assets
COPY --from=builder --chown=ingressuser:nodejs /app/apps/ingress-api/package.json /app/apps/ingress-api/package.json
COPY --from=builder --chown=ingressuser:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=ingressuser:nodejs /app/packages /app/packages

RUN mkdir -p /app/screenshots && chown ingressuser:nodejs /app/screenshots

USER ingressuser

WORKDIR /app/apps/ingress-api

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "start"]