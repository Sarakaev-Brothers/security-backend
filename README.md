# Security Backend

## Prerequisites

- Node.js 18+
- pnpm
- Docker Desktop

## Quick Start

1. Clone repository
\`\`\`bash
git clone https://github.com/Sarakaev-Brothers/security-backend.git
cd security-backend
\`\`\`

2. Install dependencies
\`\`\`bash
pnpm install
\`\`\`

3. Create .env file
\`\`\`bash
DATABASE_URL="postgresql://admin:admin123@localhost:5432/secure_yourself_db?schema=public"
NODE_ENV=development
PORT=3000
\`\`\`

4. Start database
\`\`\`bash
docker-compose up -d
\`\`\`

5. Run migrations
\`\`\`bash
pnpm prisma migrate dev
pnpm prisma generate
\`\`\`

6. Start application
\`\`\`bash
pnpm run start:dev
\`\`\`

## Development

- Start dev server: `pnpm run start:dev`
- Run tests: `pnpm test`
- Open Prisma Studio: `pnpm prisma studio`
- Format code: `pnpm run format`
- Lint code: `pnpm run lint`

## Database

- View logs: `docker-compose logs -f postgres`
- Stop database: `docker-compose stop`
- Reset database: `docker-compose down -v && docker-compose up -d`