# VexonAC V3 - Server Component

This is the server component of the VexonAC anti-cheat system. It provides APIs for FiveM servers to connect and authenticate with the VexonAC service.

## Features

- License authentication and validation
- Configuration management
- Version tracking
- Security monitoring and ban management
- Discord integration for alerts and monitoring

## Directory Structure

```
server/
â”œâ”€â”€ assets/            # Static assets
â”‚   â”œâ”€â”€ files/         # Lua script files for production
â”‚   â”œâ”€â”€ beta-files/    # Beta version Lua script files
â”‚   â””â”€â”€ defaultConfig.json  # Default configuration
â”œâ”€â”€ prisma/            # Database schema and migrations
â”œâ”€â”€ src/               # Source code
â”‚   â”œâ”€â”€ lib/           # Utility libraries
â”‚   â”œâ”€â”€ routers/       # tRPC API routes
â”‚   â”‚   â”œâ”€â”€ fivem/     # FiveM-specific API endpoints
â”‚   â”‚   â”œâ”€â”€ licenses/  # License management endpoints
â”‚   â”‚   â””â”€â”€ users/     # User management endpoints
â”‚   â”œâ”€â”€ types/         # TypeScript type definitions
â”‚   â”œâ”€â”€ legacy-routes.ts  # Express routes for FiveM compatibility
â”‚   â””â”€â”€ index.ts       # Main application entry point
â””â”€â”€ README.md          # This file
```

## Setup

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
bun install
```

2. Set up environment variables:

Create a `.env` file in the server directory with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vexonac"

# Auth
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# Discord Webhooks
DISCORD_WEBHOOK_URL="your_discord_webhook_url"
DISCORD_ERROR_WEBHOOK_URL="your_discord_error_webhook_url"

# Security
TOKEN_SECRET_KEY="your_secret_key"

# CORS
CORS_ORIGIN="https://your-web-app-domain.com"

# Server
PORT=3000
```

3. Run Prisma migrations:

```bash
npx prisma migrate dev
# or
yarn prisma migrate dev
# or
bunx prisma migrate dev
```

4. Start the server:

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

## API Endpoints

### FiveM Server Endpoints

These endpoints are accessible via both tRPC and REST APIs:

- `POST /api/license` - Authenticate license and retrieve script file
- `GET /api/config` - Get server configuration
- `POST /api/security` - Report security incidents
- `GET /api/version` - Get latest version information

### Web App Endpoints

These endpoints are accessible via tRPC:

- `/trpc/users.getUserServersList` - Get servers owned by a user
- `/trpc/licenses.redeemLicenseKey` - Redeem a license key

## License

Copyright Â© 2025 VexonAC, All rights reserved.

