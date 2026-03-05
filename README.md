# Security Backend

## Prerequisites

- Node.js 18+
- pnpm
- Docker Desktop

## Quick Start

1. Clone repository
`git clone https://github.com/Sarakaev-Brothers/security-backend.git cd security-backend`

2. Install dependencies
`pnpm install`

4. Create .env file
`DATABASE_URL="postgresql://admin:admin123@localhost:5432/secure_yourself_db?schema=public"
NODE_ENV=development
PORT=3000`

5. Start database
`docker-compose up -d`

6. Run migrations
`
pnpm prisma migrate dev
pnpm prisma generate
`

8. Start application
`
pnpm run start:dev
`

## Development

- Start dev server: `pnpm run start:dev`
- Swagger Documentation: `http://localhost:3000/docs`
- Run tests: `pnpm test`
- Open Prisma Studio: `pnpm prisma studio`
- Format code: `pnpm run format`
- Lint code: `pnpm run lint`

## Database

- View logs: `docker-compose logs -f postgres`
- Stop database: `docker-compose stop`
- Reset database: `docker-compose down -v && docker-compose up -d`

## Migration
### 1. Create a migration
pnpm prisma migrate dev --name init

### 2. Generate Prisma Client
pnpm prisma generate
