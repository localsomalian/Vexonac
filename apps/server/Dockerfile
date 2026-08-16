# Build stage
FROM oven/bun:1.2.13-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy workspace dependencies
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/

# Install dependencies (skip postinstall to avoid prisma version conflicts)
RUN bun install --ignore-scripts

# Generate Prisma client with the pinned version
RUN cd packages/database && bunx prisma@6.9.0 generate --schema prisma/schema.prisma

# Copy source code
COPY apps/server/ ./apps/server/
COPY packages/ ./packages/

# Build the application
RUN bun run build --filter=server

# Production stage
FROM oven/bun:1.2.13-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 serveruser

# Copy built application
COPY --from=builder --chown=serveruser:nodejs /app/apps/server/dist /app/apps/server/dist
COPY --from=builder --chown=serveruser:nodejs /app/apps/server/assets /app/apps/server/assets
COPY --from=builder --chown=serveruser:nodejs /app/apps/server/package.json /app/apps/server/package.json
COPY --from=builder --chown=serveruser:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=serveruser:nodejs /app/packages /app/packages

USER serveruser

WORKDIR /app/apps/server

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "start"]