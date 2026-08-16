# CLAUDE.md — VexonAC Panel

This file is read by Claude Code for every session, including autonomous maintenance runs via cron.

---

## Quick Reference

| Thing | Value |
|---|---|
| Project root | `/var/www/html/Vexonac/Vexonac/panel/` |
| Rebuild service | `docker compose build <service> && docker compose up -d <service>` |
| Check logs | `docker compose logs --tail=200 <service>` |
| All service health | `docker compose ps` |
| Services | `web` (:3000), `server` (:4000), `ingress` (:5000), `postgres` (:5432) |

---

## Project Overview

VexonAC is a FiveM anti-cheat management SaaS. Server owners pay for a dashboard to manage bans, player logs, and anti-cheat config for their FiveM game servers.

**Stack:** Bun monorepo (Turborepo), Next.js 15 web, Express+tRPC server, Express ingress-api, Postgres 17, better-auth, Prisma, shadcn/ui.

**Source layout:**
- `apps/web/` — Next.js 15 frontend
- `apps/server/` — Express + tRPC API backend
- `apps/ingress-api/` — FiveM server WebSocket relay
- `packages/database/` — Prisma schema + client
- `packages/types/` — shared TypeScript types
- `packages/utils/` — shared utilities

---

## Autonomous Maintenance — Step-by-Step

When running as the autonomous maintenance agent, execute this checklist in order:

### Step 1 — Check all service logs for real errors

```bash
cd /var/www/html/Vexonac/Vexonac/panel
docker compose logs --since=2h web   2>&1 | grep -iE "error|uncaught|unhandled|crash|exception" | grep -v "DEBUG"
docker compose logs --since=2h server 2>&1 | grep -iE "error|uncaught|unhandled|crash|exception" | grep -v "healthCheck"
docker compose logs --since=2h ingress 2>&1 | grep -iE "error|uncaught|unhandled|crash|exception"
```

### Step 2 — Ignore known noise (these are NOT bugs)

| Pattern | Why it's noise |
|---|---|
| `healthCheck undefined` | Fixed: was a debug `console.log` in `apps/server/src/lib/context.ts` — now removed |
| `Failed to find Server Action` | Fixed: handled client-side by `DeploymentSyncGuard` component |
| `Updated bot status` | Normal Discord bot cron output |
| Socket.IO connect/disconnect events | Normal FiveM server reconnects |
| `[CRON] ... No expired bans found` | Normal scheduled job output |
| `[CRON] ... Found 0 active servers` | Normal when no servers are online |

### Step 3 — For each real error found

1. Read the relevant source file to understand the issue
2. Fix the code (follow conventions in the Code Style section below)
3. Rebuild only the affected service:
   ```bash
   cd /var/www/html/Vexonac/Vexonac/panel
   docker compose build <service>
   docker compose up -d <service>
   docker compose ps   # confirm healthy
   ```
4. Check logs again to confirm the error is gone

### Step 4 — Verify overall health

```bash
docker compose ps   # all services should show (healthy) or Up
```

If a container is down, check its logs and fix the root cause before restarting.

---

## Deployment — Rebuild Commands

Always rebuild only the service whose code changed:

```bash
cd /var/www/html/Vexonac/Vexonac/panel

# Frontend (Next.js)
docker compose build web && docker compose up -d web

# Backend API
docker compose build server && docker compose up -d server

# FiveM relay
docker compose build ingress && docker compose up -d ingress
```

**Never restart postgres without explicit user instruction.** It holds live data.

---

## Code Style & Conventions

- **Indentation:** Tabs
- **Quotes:** Single quotes (except to avoid escaping)
- **Semicolons:** Omitted
- **Naming:** PascalCase components/types, kebab-case files, camelCase vars/functions, UPPERCASE env vars
- **No comments** unless the WHY is non-obvious
- **No error handling** for impossible cases — only validate at system boundaries

---

## Key File Locations

| File | Purpose |
|---|---|
| `apps/server/src/lib/context.ts` | tRPC request context — session, demo mode, client IP |
| `apps/server/src/lib/auth.ts` | better-auth configuration |
| `apps/server/src/routers/index.ts` | tRPC router — all API procedures |
| `apps/server/src/routes/v1/` | REST API routes (stats, servers, bans, etc.) |
| `apps/server/src/routes/payments/` | Payment webhooks (Polar, NowPayments, Mollie, Square) |
| `apps/server/src/services/` | Business logic services |
| `apps/server/src/lib/discord.ts` | Discord webhook alerts |
| `apps/web/src/app/[locale]/dashboard/` | Dashboard pages |
| `apps/web/src/components/` | Shared React components |
| `apps/web/src/components/deployment-sync-guard.tsx` | Auto-reloads stale clients after deploy |
| `apps/web/src/components/providers.tsx` | Root React providers |
| `packages/database/prisma/schema.prisma` | Database schema |

---

## Known Issues (open — not yet fixed)

None currently. All previously identified issues have been resolved.

## Recently Fixed (for context)

| Fix | Files |
|---|---|
| Removed debug `console.log(url, body)` that fired on every tRPC request | `apps/server/src/lib/context.ts` |
| `identifiers.tracked_total` now runs real Postgres `jsonb_array_length` query | `apps/server/src/routes/v1/stats.routes.ts` |
| NOWPayments refund deletes unredeemed key; Discord alert if key already redeemed | `apps/server/src/routes/payments/webhook-nowpayments.ts` |
| Mollie refund/chargeback deletes unredeemed key or bans active license automatically | `apps/server/src/routes/payments/webhook-mollie.ts` |
| Square `refund.created`/`refund.updated` events now handled with full revocation | `apps/server/src/routes/payments/webhook-square.ts` |
| Global `uncaughtException` + `unhandledRejection` handlers added | `apps/server/src/index.ts` |
| `DeploymentSyncGuard` component auto-reloads stale clients after deploy | `apps/web/src/components/deployment-sync-guard.tsx` |
| `bans_issued +3000000` is intentional marketing floor | `apps/server/src/routes/v1/stats.routes.ts` |

---

## Security Rules — Always Enforce

- Never log sensitive values (tokens, passwords, webhook URLs, API keys)
- Never expose stack traces in API responses — return generic errors to clients
- Never commit or modify `.env` — it is gitignored and contains live secrets
- After the May 2026 crypto-miner incident: treat any unexpected process execution (`exec`, `spawn`, `wget`, `curl` to external IPs) as a critical alert
- If you find suspicious code (obfuscated JS, unexpected network calls, base64 blobs), stop and notify via the Discord error webhook in `apps/server/src/lib/discord.ts`

---

## Environment

- **OS:** Ubuntu on a VPS
- **Runtime inside containers:** Bun
- **Database:** Postgres 17 in `panel-postgres-1` container
- **Nginx:** Handles SSL termination — config at `/etc/nginx/sites-enabled/vexonac`
- **Existing maintenance scripts:** `/usr/local/bin/vexonac-backup`, `vexonac-cleanup`, `vexonac-expiry-alerts`, `vexonac-monitor`
- **Claude CLI:** `/home/ubuntu/.vscode-server/extensions/anthropic.claude-code-2.1.193-linux-x64/resources/native-binary/claude`
