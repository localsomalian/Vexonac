# @vexonac/database

Shared database schema and client for the VexonAC monorepo.

## Overview

This package provides a centralized database configuration using Prisma that can be shared across all applications in the monorepo. It includes:

- Prisma schema definitions
- Generated Prisma client
- TypeScript types for all database models
- Utility functions for common database operations

## Usage

### Basic Import

```typescript
import { PrismaClient } from "@vexonac/database";

const prisma = new PrismaClient();
```

### With Accelerate Extension

```typescript
import { PrismaClient } from "@vexonac/database";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());
```

### Using Utility Functions

```typescript
import {
  createPrismaClient,
  checkDatabaseHealth,
  disconnectDatabase,
} from "@vexonac/database";

// Create a configured client with accelerate
const prisma = createPrismaClient({
  log: true,
  accelerate: true,
});

// Check database health
const isHealthy = await checkDatabaseHealth(prisma);

// Graceful disconnect
await disconnectDatabase(prisma);
```

### Type Imports

```typescript
import type {
  User,
  License,
  Member,
  Permission,
  ActivityType,
  Prisma,
} from "@vexonac/database";
```

## Development

### Generate Prisma Client

```bash
npm run db:generate
```

### Run Migrations

```bash
npm run db:migrate
```

### Reset Database

```bash
npm run db:reset
```

### Open Prisma Studio

```bash
npm run db:studio
```

## Schema Location

The Prisma schema is located at `prisma/schema.prisma` and the generated client is output to `prisma/generated/client/`.

## Apps Integration

Each app in the monorepo should:

1. Add `@vexonac/database` as a dependency
2. Create a `prisma.config.ts` file pointing to the shared schema
3. Import the PrismaClient from the shared package

### Example App Configuration

```typescript
// prisma.config.ts
import type { PrismaConfig } from "@prisma/config";
import path from "node:path";

export default {
  earlyAccess: true,
  schema: path.join("../../packages/database/prisma/schema.prisma"),
} satisfies PrismaConfig;
```

```typescript
// lib/prisma.ts
import { PrismaClient } from "@vexonac/database";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
}).$extends(withAccelerate());

export default prisma;
```


