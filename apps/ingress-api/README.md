# VexonAC Ingress API

A dedicated API service for handling FiveM server connections, authentication, and real-time events.

## Overview

The Ingress API serves as the entry point for all FiveM server communications, providing:

- **Authentication**: Secure license validation for FiveM servers
- **Real-time Events**: WebSocket connections for live game events
- **Event Processing**: Handles player activities, anticheat detections, bans
- **Configuration Management**: Serves and updates server configurations
- **Redis Pub/Sub**: Publishes events for consumption by other services

## Architecture Benefits

### ðŸ”„ **Separation of Concerns**

- **Ingress API**: Handles FiveM server traffic (high frequency, game-specific)
- **Main Server**: Handles web app traffic (user dashboard, management)

### ðŸš€ **Performance**

- Dedicated service for game server requests
- Independent scaling based on traffic patterns
- Optimized for high-frequency, low-latency requests

### ðŸ”’ **Security**

- Isolated authentication for game servers
- Rate limiting specific to FiveM traffic
- JWT-based session management

### ðŸ“¡ **Real-time Communication**

- WebSocket connections for instant event delivery
- Redis pub/sub for cross-service communication
- Live server status updates

## API Endpoints

### Authentication

```http
POST /api/auth
Content-Type: application/json

{
  "licenseKey": "your-license-key",
  "serverInfo": {
    "name": "My FiveM Server",
    "playerCount": 25,
    "maxSlots": 128,
    "version": "1.0.0",
    "ip": "192.168.1.100"
  }
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt-token",
  "serverId": "server-uuid",
  "config": {...},
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Game Events

```http
POST /api/events
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "PLAYER_JOIN",
  "data": {
    "playerName": "John Doe",
    "playerId": "steam:110000123456789",
    "identifiers": [...]
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Configuration

```http
GET /api/config
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "config": {
    "anticheat": {...},
    "modules": {...}
  },
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

## WebSocket Events

### Authentication

```javascript
socket.emit("authenticate", { token: "jwt-token" });
socket.on("authenticated", (data) => {
  console.log("Authenticated:", data.success);
});
```

### Game Events

```javascript
socket.emit("game_event", {
  type: "ANTICHEAT_DETECTION",
  data: {
    playerName: "Cheater123",
    violation: "Speed Hack",
    severity: "HIGH",
  },
});

socket.on("event_ack", (data) => {
  console.log("Event processed:", data.success);
});
```

### Configuration Updates

```javascript
socket.on("config_update", (data) => {
  console.log("New config:", data.config);
  // Update local configuration
});
```

## Redis Events

The service publishes events to Redis channels for consumption by other services:

### `game:events` Channel

```json
{
  "type": "SERVER_ONLINE",
  "serverId": "server-uuid",
  "serverInfo": {...},
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### `config:updates` Channel

```json
{
  "serverId": "server-uuid",
  "config": {...},
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## Integration with Main Server

### Database Sharing

Both services use the same Prisma schema and database:

```typescript
// Shared database package
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
```

### Event Flow

```
FiveM Server â†’ Ingress API â†’ Redis â†’ Main Server â†’ Web Client
```

1. **FiveM Server** sends events to Ingress API
2. **Ingress API** processes and stores events in database
3. **Ingress API** publishes events to Redis
4. **Main Server** subscribes to Redis events
5. **Main Server** sends real-time updates to web clients

### Example: Main Server Redis Subscriber

```typescript
// In your main server
const redis = new Redis(process.env.REDIS_URL);

redis.subscribe("game:events");
redis.on("message", (channel, message) => {
  if (channel === "game:events") {
    const event = JSON.parse(message);

    // Send to web clients via WebSocket/SSE
    io.emit("game-event", event);

    // Or trigger tRPC subscriptions
    ee.emit("game-event", event);
  }
});
```

## Environment Variables

```env
# Database (shared with main server)
DATABASE_URL="postgresql://user:password@localhost:5432/vexonac"

# Redis
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your-jwt-secret"

# Server
PORT=3002
NODE_ENV=development

# CORS (allow main server and web app)
CORS_ORIGIN="https://your-web-app.com,http://localhost:3000"

# Logging
LOG_LEVEL="info"
```

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## Production Deployment

### Docker Example

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build application
RUN bun run build

# Production stage
FROM oven/bun:1-slim
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./

EXPOSE 3002
CMD ["bun", "run", "start"]
```

### Load Balancer Configuration

```nginx
upstream ingress_api {
    server ingress-api-1:3002;
    server ingress-api-2:3002;
    server ingress-api-3:3002;
}

server {
    listen 80;
    server_name ingress.vexonac.com;

    location / {
        proxy_pass http://ingress_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring

### Health Check

```bash
curl http://localhost:3002/health
```

### Metrics Integration

The service supports Prometheus metrics for monitoring:

- Request count and duration
- WebSocket connection count
- Redis operation metrics
- Database query performance

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Common Error Codes

- `INVALID_LICENSE`: License key not found or expired
- `AUTHENTICATION_FAILED`: Invalid JWT token
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_REQUEST`: Malformed request data

## Security Features

- **Rate Limiting**: 100 requests per minute per IP
- **JWT Authentication**: Secure session management
- **Input Validation**: Zod schema validation
- **Helmet.js**: Security headers
- **CORS Protection**: Configured origins only

This architecture provides a robust, scalable solution for handling FiveM server communications while maintaining clean separation from your web application infrastructure.

