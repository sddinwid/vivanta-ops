# Vivanta Operations OS

Monorepo scaffold for an internal AI-assisted property operations platform.

## Stack

- `pnpm` workspaces + Turborepo
- `apps/api`: NestJS modular monolith API
- `apps/web`: Next.js (App Router) frontend
- PostgreSQL + Prisma
- Redis + Temporal placeholders
- Docker Compose for local infra

## Structure

```text
apps/
  api/
  web/
packages/
  config/
  observability/
infra/
  docker/
docs/
  architecture/
  workflows/
  adr/
```

## Quick Start

```bash
# macOS/Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

pnpm install
docker compose -f infra/docker/docker-compose.yml up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```
