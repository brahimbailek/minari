# CommPro - Professional Communication Platform

> 🚀 Modern, mobile-first communication platform combining virtual phone numbers, HD calls, and secure messaging.

[![License](https://img.shields.io/badge/license-PROPRIETARY-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)](https://www.typescriptlang.org/)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)

## ✨ Features

### Phase 1 (Current - MVP)

- 📞 **Virtual Phone Numbers** - Purchase and manage numbers in 6+ countries (FR, US, UK, DE, ES, IT)
- 🎙️ **HD Voice Calls** - Crystal-clear calls with native OS integration (CallKit/Telecom)
- 💬 **Secure Messaging** - SMS/MMS with end-to-end encryption
- 👥 **Smart Contacts** - Intelligent contact management with tags and sync
- 🔐 **Enterprise Security** - 2FA, JWT tokens, biometric auth
- 💳 **Flexible Billing** - 4 subscription tiers with Stripe integration
- 📱 **Native Mobile Apps** - iOS (Swift/SwiftUI) and Android (Kotlin/Compose)
- 🔔 **Real-time Notifications** - VoIP push for instant call alerts

### Phase 2 (Roadmap)

- 📹 **Video Calls** - Group video conferencing (up to 10 participants)
- 🎤 **Voicemail** - AI-powered transcription and voicemail-to-email
- 📊 **Advanced Analytics** - Business intelligence dashboard
- 🔗 **Integrations** - Zapier, Slack, HubSpot, Salesforce
- 👨‍👩‍👧‍👦 **Team Features** - Multi-user accounts, call queues, IVR

## 🏗️ Architecture

CommPro uses a **microservices architecture** with the following services:

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (Railway)                 │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Auth Service   │ │  Numbers Service │ │ Messaging Service│
│   Port: 3001     │ │   Port: 3002     │ │   Port: 3003     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL      │
                    └───────────────────┘

┌──────────────────┐ ┌──────────────────┐
│  Billing Service │ │   Call Service   │
│   Port: 3004     │ │   Port: 3005     │
└──────────────────┘ └──────────────────┘
```

### Services

1. **Auth Service** (Port 3001)
   - User authentication (register, login, JWT)
   - 2FA (TOTP)
   - Password management
   - Email verification

2. **Numbers Service** (Port 3002)
   - Purchase virtual numbers (Twilio)
   - Number management (assign, release)
   - Number porting

3. **Messaging Service** (Port 3003)
   - Send/receive SMS/MMS
   - E2E encryption
   - Real-time sync (Socket.io)
   - Conversation management

4. **Call Service** (Port 3005)
   - Initiate/receive calls (Twilio Voice)
   - Call history
   - Call quality monitoring

5. **Billing Service** (Port 3004)
   - Subscription management (Stripe)
   - Usage tracking
   - Invoice generation

## 🛠️ Tech Stack

### Backend

- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL 15 (Prisma ORM)
- **Cache:** Redis 7
- **API:** RESTful + WebSockets (Socket.io)
- **Auth:** JWT + bcrypt
- **Validation:** Zod

### Mobile

- **iOS:** Swift 5.9+, SwiftUI, CallKit, PushKit
- **Android:** Kotlin 1.9+, Jetpack Compose, Telecom Framework

### Infrastructure

- **Hosting:** Railway
- **Telephony:** Twilio (Voice + Messaging)
- **Payments:** Stripe
- **Push Notifications:** Firebase (FCM + APNs)
- **Monitoring:** Sentry
- **CDN:** Cloudflare

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org))
- **npm** >= 10.0.0 (comes with Node.js)
- **Docker** >= 24.0.0 ([Download](https://docker.com))
- **Git** ([Download](https://git-scm.com))

### Required Accounts

You'll need accounts for the following services:

- [Twilio](https://www.twilio.com) - For telephony (voice + SMS)
- [Stripe](https://stripe.com) - For payments
- [Firebase](https://firebase.google.com) - For push notifications
- [Railway](https://railway.app) - For deployment (optional, for production)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/commpro.git
cd commpro
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commpro_dev?schema=public"

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
# ... (see .env.example for full list)
```

### 4. Start Infrastructure (Docker)

Start PostgreSQL and Redis with Docker Compose:

```bash
npm run docker:up
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Adminer (database UI) on port 8080

### 5. Setup Database

Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

Optional: Open Prisma Studio to view your database:

```bash
npm run db:studio
```

### 6. Start Development Servers

Start all services in development mode:

```bash
npm run dev
```

This will start:
- Auth Service on http://localhost:3001
- Numbers Service on http://localhost:3002
- Messaging Service on http://localhost:3003
- Billing Service on http://localhost:3004
- Call Service on http://localhost:3005

### 7. Verify Setup

Check that all services are healthy:

```bash
# Auth Service
curl http://localhost:3001/health

# Should return: {"status":"OK","service":"auth-service",...}
```

## 💻 Development

### Project Structure

```
commpro/
├── apps/                       # Microservices
│   ├── auth-service/          # Authentication service
│   ├── numbers-service/       # Phone numbers management
│   ├── messaging-service/     # SMS/MMS handling
│   ├── call-service/          # Voice calls
│   └── billing-service/       # Subscriptions & billing
├── packages/
│   ├── database/              # Prisma schema + client
│   └── shared/                # Shared utilities
├── mobile/
│   ├── ios/                   # iOS app (Swift/SwiftUI)
│   └── android/               # Android app (Kotlin/Compose)
├── docs/                      # Documentation
├── docker-compose.yml         # Local infrastructure
├── turbo.json                 # Monorepo config
└── package.json               # Root package
```

### Available Scripts

```bash
# Development
npm run dev              # Start all services in dev mode
npm run dev:auth         # Start only auth service
npm run docker:up        # Start PostgreSQL + Redis
npm run docker:down      # Stop Docker containers

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes (dev only)
npm run db:studio        # Open Prisma Studio

# Build
npm run build            # Build all services
npm run build:auth       # Build only auth service

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Lint all code
npm run format           # Format code with Prettier
```

### Adding a New Service

1. Create service directory:
```bash
mkdir -p apps/my-service/src/{controllers,routes,middleware,services}
```

2. Add `package.json`:
```json
{
  "name": "@commpro/my-service",
  "dependencies": {
    "@commpro/database": "*",
    "express": "^4.18.2"
  }
}
```

3. Register in root `package.json` workspaces

### Database Migrations

When you modify the Prisma schema:

```bash
# 1. Edit packages/database/prisma/schema.prisma

# 2. Create migration
npm run db:migrate -- --name add_my_feature

# 3. Generate client
npm run db:generate
```

## 🚢 Deployment

### Railway (Production)

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

2. **Create Project:**
```bash
railway init
```

3. **Add PostgreSQL:**
```bash
railway add postgresql
```

4. **Deploy Services:**
```bash
railway up
```

5. **Set Environment Variables:**
```bash
railway variables set JWT_SECRET=your_secret
railway variables set TWILIO_ACCOUNT_SID=ACxxx
# ... (set all required variables)
```

6. **View Logs:**
```bash
railway logs
```

### Environment-Specific Configs

**Development** (.env)
- Local PostgreSQL/Redis (Docker)
- Twilio test credentials
- Stripe test mode

**Production** (.env.production)
- Railway PostgreSQL
- Twilio production credentials
- Stripe live mode
- Sentry DSN for monitoring

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

- [Architecture Overview](./docs/architecture.md)
- [API Documentation](./docs/api.md) (Swagger at `/api-docs`)
- [Database Schema](./docs/database.md)
- [Mobile Apps Guide](./docs/mobile.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Guide](./docs/security.md)

### Quick Links

- **Complete Implementation Plan:** [COMMPRO-PHASE1-PLAN.md](./COMMPRO-PHASE1-PLAN.md)
- **API Reference:** http://localhost:3001/api-docs (when running)
- **Database Studio:** http://localhost:5555 (Prisma Studio)
- **Adminer:** http://localhost:8080 (Database UI)

## 🧪 Testing

Run the test suite:

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific service
npm run test -- --filter=auth-service
```

## 🔒 Security

- **Authentication:** JWT with short-lived access tokens (15min) + refresh tokens (7d)
- **2FA:** TOTP-based two-factor authentication
- **Encryption:** E2E encryption for messages (AES-256-GCM)
- **Rate Limiting:** Aggressive rate limits on auth endpoints
- **Secrets:** Stored in environment variables, never committed
- **HTTPS Only:** TLS 1.3 enforced in production
- **Security Headers:** Helmet.js configured

Report security vulnerabilities to: security@commpro.io

## 📊 Monitoring

- **Uptime:** Health checks on `/health` endpoint
- **Errors:** Sentry for error tracking
- **Logs:** Winston for structured logging
- **Metrics:** Custom Prometheus metrics (Phase 2)

## 🤝 Contributing

This is a proprietary project. For internal contributors:

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add my feature"`
3. Push to branch: `git push origin feature/my-feature`
4. Create Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## 📞 Support

- **Documentation:** [docs/](./docs)
- **Issues:** Contact tech lead
- **Email:** dev@commpro.io

## 📝 License

PROPRIETARY - All rights reserved.

---

**Made with ❤️ by the CommPro Team**

**Version:** 1.0.0 (Phase 1 MVP)
**Last Updated:** 2026-02-15
