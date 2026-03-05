<img width="332" height="346" alt="image" src="https://github.com/user-attachments/assets/a8ac620f-3f7f-47e8-aaad-af5c48525ff6" />

# Secure Family Location Sharing (Pet Project)

## Overview

This project was originally started as a team initiative aimed at helping people safely stay connected with their family members while traveling.

The idea was to build a mobile-oriented service where users could securely share their location with trusted family members or group participants during trips or journeys.

I designed the system architecture, security model, and implemented the core backend modules.  
Together with a small team of developers, we also worked on the product and UI design, aiming to create a clean, intuitive, and user-friendly experience.

The main focus of the project was **privacy, security, and real-time data sharing**.

---

# Architecture

The backend is built with **NestJS** and designed with scalability and real-time communication in mind.

Key architectural decisions:

- **Redis** is used for real-time location sharing because location data is temporary and frequently updated.
  
  This allows Redis to act as a fast in-memory store and significantly reduce the load on the main database.

- The **primary database** stores only historical location data which would be updated every *N seconds*.

- Real-time updates between group participants were planned to be implemented using **Server-Sent Events (SSE)**.

This approach allows clients to receive continuous updates without constant polling.

---

# Security & Privacy

A major goal of the project was protecting user data.

Security mechanisms include:

- **End-to-end encryption** for location data so that even the server cannot read the actual location information.  
  This approach is similar to the encryption model used in secure messaging applications.

- Location data protection using **encryption keys** to prevent leaks or unauthorized access.

- **Request throttling / rate limiting** to mitigate potential DDoS attacks.

- Planned infrastructure protection using **Cloudflare** for additional traffic filtering and DDoS protection.

---

# Technology Stack

Backend:

- NestJS
- PostgreSQL
- Redis
- Prisma ORM

Infrastructure / Dev tools:

- Docker
- Swagger (API documentation)
- ESLint
- Prettier
- pnpm

Development assistance:

- Cursor
- GPT-5.2
- Claude 4.5

These AI tools were used to assist with development, research, and architectural exploration.

---

# Development Notes

I was responsible for the **backend development** of this project.

At the time of writing (March 5, 2026), my backend experience is approximately **2 years**, while my primary expertise is in **frontend development**.

Despite this, I focused on designing the backend architecture carefully, researching best practices and applying logical architectural decisions based on my experience.

---

# Project Status

The backend reached approximately **60% readiness for an MVP**.

Due to limited available time for development and other work commitments, the team decided to stop active development.

The project later transitioned into a **personal pet project**.

---

# Repository Structure Notes

Some files and structural decisions in the repository were planned to be **refactored and reorganized later**.

Due to time constraints while working toward the MVP, certain parts of the repository structure were left as-is and were intended to be cleaned up in later iterations.

Examples include:

- auxiliary documentation files
- temporary configuration files
- structural improvements planned for modules and folders

These were part of an ongoing development process rather than the final intended structure.

---

# Future Improvements (Not Implemented)

Planned but not yet completed improvements include:

- implementing **SSE-based real-time location tracking** for group participants
- integrating a **payment system** for subscription-based access
- implementing **advanced rate limiting and abuse protection**
- improving infrastructure-level security and traffic filtering
- refactoring module boundaries to remove **circular dependencies and cross-module imports** that appeared during rapid MVP development

# Quick Start

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
1. Create a migration
`pnpm prisma migrate dev --name init`

2. Generate Prisma Client
`pnpm prisma generate`
