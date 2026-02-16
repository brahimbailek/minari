# CommPro - Phase 1 MVP Plan Complet
## Plan de développement détaillé (2.5 mois)

---

## 📋 Vue d'ensemble

**Objectif** : Lancer un MVP fonctionnel de plateforme de communication professionnelle combinant les meilleures fonctionnalités de Minari.io et OnOff.

**Délai** : 2.5 mois (10 semaines)
**Budget** : €9,500 (développement) + €66/mois (infrastructure à 1000 users)
**Équipe recommandée** : 1 dev fullstack + 1 dev mobile ou 2 devs fullstack

---

## 🎯 Fonctionnalités Phase 1

### ✅ Inclus dans MVP
1. **Gestion des numéros virtuels** (Twilio)
   - Achat de numéros locaux (FR, US, UK, DE, ES, IT)
   - Attribution aux utilisateurs
   - Affichage dans l'app

2. **Appels téléphoniques**
   - Appels sortants depuis numéro virtuel
   - Réception d'appels entrants
   - Historique des appels
   - Qualité audio HD

3. **SMS/MMS**
   - Envoi/réception de SMS
   - Support MMS (images)
   - Conversations groupées
   - Notifications push

4. **Contacts intelligents**
   - Synchronisation contacts téléphone
   - Gestion tags et catégories
   - Recherche rapide
   - Historique par contact

5. **Authentification & Sécurité**
   - Inscription email/password
   - 2FA (SMS ou TOTP)
   - JWT tokens (access + refresh)
   - Chiffrement E2E messages

6. **Système d'abonnement**
   - 3 plans (Starter, Business, Enterprise)
   - Stripe integration
   - Gestion upgrades/downgrades
   - Facturation automatique

7. **Applications mobiles**
   - iOS (Swift/SwiftUI)
   - Android (Kotlin/Jetpack Compose)
   - UI moderne et fluide
   - Notifications push natives

### ❌ Reporté à Phase 2
- Appels vidéo
- Partage d'écran
- Enregistrement d'appels
- Analytics avancés
- Intégrations (CRM, Slack, etc.)
- Web app complète (uniquement dashboard admin en Phase 1)

---

## 🏗️ Architecture Technique

### Stack Technologique

**Backend (Microservices)**
```
- Node.js + TypeScript
- Express.js (API)
- Prisma (ORM)
- PostgreSQL (base de données)
- Redis (cache + sessions)
- JWT (authentification)
- Socket.io (temps réel)
```

**Mobile**
```
iOS:
- Swift 5.9+
- SwiftUI (UI déclarative)
- Combine (reactive)
- CallKit (intégration appels natifs)
- PushKit (VoIP push)
- Keychain (stockage sécurisé)

Android:
- Kotlin 1.9+
- Jetpack Compose (UI moderne)
- Coroutines + Flow (async)
- Telecom Framework (gestion appels)
- WorkManager (tâches background)
- EncryptedSharedPreferences (sécurité)
```

**Infrastructure**
```
- Railway (hébergement)
- Twilio (téléphonie)
- Stripe (paiements)
- Firebase (push notifications)
- Cloudflare (CDN + DDoS protection)
```

### Architecture Microservices

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
│                  │ │                  │ │                  │
│ - Signup/Login   │ │ - Buy numbers    │ │ - Send/Receive   │
│ - JWT tokens     │ │ - Assign users   │ │ - SMS/MMS        │
│ - 2FA            │ │ - Twilio sync    │ │ - Conversations  │
│ - Refresh        │ │ - Port numbers   │ │ - E2E encryption │
└──────────────────┘ └──────────────────┘ └──────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL      │
                    │   (Railway)       │
                    └───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Redis Cache     │
                    │   (Railway)       │
                    └───────────────────┘

┌──────────────────┐ ┌──────────────────┐
│  Billing Service │ │   Call Service   │
│   Port: 3004     │ │   Port: 3005     │
│                  │ │                  │
│ - Subscriptions  │ │ - Initiate calls │
│ - Stripe webhook │ │ - Call routing   │
│ - Invoices       │ │ - Call history   │
│ - Usage tracking │ │ - Twilio Voice   │
└──────────────────┘ └──────────────────┘
          │                   │
          │                   │
    ┌─────▼──────┐      ┌────▼──────┐
    │   Stripe   │      │  Twilio   │
    │   API      │      │   API     │
    └────────────┘      └───────────┘
```

### Communication entre services

```typescript
// Service-to-service auth avec JWT interne
// Exemple: Messaging Service appelle Numbers Service

// messaging-service/src/utils/serviceAuth.ts
const SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

export async function callNumbersService(endpoint: string, data: any) {
  const token = jwt.sign(
    { service: 'messaging', timestamp: Date.now() },
    SERVICE_SECRET,
    { expiresIn: '5m' }
  );

  const response = await fetch(
    `${process.env.NUMBERS_SERVICE_URL}${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  return response.json();
}

// Middleware de validation pour les appels internes
export function validateServiceToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No service token' });

  try {
    const decoded = jwt.verify(token, SERVICE_SECRET);
    if (decoded.service) {
      req.callingService = decoded.service;
      next();
    } else {
      res.status(403).json({ error: 'Invalid service token' });
    }
  } catch (error) {
    res.status(403).json({ error: 'Invalid service token' });
  }
}
```

---

## 💾 Schéma de Base de Données

### Tables principales

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE subscription_tier AS ENUM ('FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role DEFAULT 'USER',

  -- 2FA
  two_fa_enabled BOOLEAN DEFAULT false,
  two_fa_secret VARCHAR(64),

  -- Profile
  avatar_url TEXT,
  company_name VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',

  -- Status
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_email (email),
  INDEX idx_phone (phone_number)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);

-- ============================================
-- PHONE NUMBERS
-- ============================================

CREATE TYPE number_status AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE number_type AS ENUM ('LOCAL', 'MOBILE', 'TOLL_FREE');

CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Number details
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  friendly_name VARCHAR(100),
  country_code VARCHAR(5) NOT NULL, -- FR, US, UK, etc.
  number_type number_type DEFAULT 'LOCAL',

  -- Twilio
  twilio_sid VARCHAR(100) UNIQUE NOT NULL,
  twilio_capabilities JSONB, -- voice, sms, mms

  -- Status
  status number_status DEFAULT 'ACTIVE',
  purchased_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Pour renouvellement mensuel

  -- Pricing
  monthly_cost DECIMAL(10,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_phone_number (phone_number),
  INDEX idx_status (status)
);

-- ============================================
-- CONTACTS
-- ============================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Contact info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  notes TEXT,

  -- Organization
  tags TEXT[], -- ['client', 'urgent', 'vip']
  is_favorite BOOLEAN DEFAULT false,

  -- Avatar
  avatar_url TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, phone_number),
  INDEX idx_user_id (user_id),
  INDEX idx_phone_number (phone_number),
  INDEX idx_tags (tags)
);

-- ============================================
-- CALLS
-- ============================================

CREATE TYPE call_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE call_status AS ENUM ('QUEUED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER', 'CANCELLED');

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Call details
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  direction call_direction NOT NULL,
  status call_status NOT NULL,

  -- Twilio
  twilio_call_sid VARCHAR(100) UNIQUE,

  -- Timing
  started_at TIMESTAMP,
  answered_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER DEFAULT 0, -- Durée totale
  billable_duration_seconds INTEGER DEFAULT 0, -- Durée facturable

  -- Cost
  cost DECIMAL(10,4),
  cost_currency VARCHAR(3) DEFAULT 'EUR',

  -- Recording (Phase 2)
  recording_url TEXT,
  recording_duration_seconds INTEGER,

  -- Metadata
  user_agent TEXT,
  quality_score INTEGER, -- 1-5

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_contact_id (contact_id),
  INDEX idx_from_number (from_number),
  INDEX idx_to_number (to_number),
  INDEX idx_started_at (started_at),
  INDEX idx_status (status)
);

-- ============================================
-- MESSAGES (SMS/MMS)
-- ============================================

CREATE TYPE message_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE message_status AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'RECEIVED');
CREATE TYPE message_type AS ENUM ('SMS', 'MMS');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID, -- Pour regrouper les messages (calculé: hash des 2 numéros)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Message details
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  direction message_direction NOT NULL,
  type message_type DEFAULT 'SMS',

  -- Content
  body TEXT,
  media_urls TEXT[], -- Pour MMS

  -- Twilio
  twilio_message_sid VARCHAR(100) UNIQUE,
  status message_status NOT NULL,
  error_code INTEGER,
  error_message TEXT,

  -- E2E Encryption
  is_encrypted BOOLEAN DEFAULT true,
  encryption_key_id VARCHAR(64), -- Pour rotation des clés

  -- Timing
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,

  -- Cost
  cost DECIMAL(10,4),
  cost_currency VARCHAR(3) DEFAULT 'EUR',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_contact_id (contact_id),
  INDEX idx_from_number (from_number),
  INDEX idx_to_number (to_number),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- SUBSCRIPTIONS & BILLING
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe
  stripe_customer_id VARCHAR(100) UNIQUE,
  stripe_subscription_id VARCHAR(100) UNIQUE,
  stripe_price_id VARCHAR(100),

  -- Plan
  tier subscription_tier NOT NULL,
  status subscription_status DEFAULT 'TRIALING',

  -- Dates
  trial_ends_at TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Pricing
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_stripe_customer_id (stripe_customer_id),
  INDEX idx_status (status)
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Stripe
  stripe_invoice_id VARCHAR(100) UNIQUE,

  -- Details
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50), -- paid, open, void, uncollectible

  -- Items
  line_items JSONB, -- Détail de la facturation

  -- Dates
  invoice_date TIMESTAMP NOT NULL,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,

  -- PDF
  invoice_pdf_url TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_status (status)
);

-- ============================================
-- USAGE TRACKING (pour facturation)
-- ============================================

CREATE TYPE usage_type AS ENUM ('CALL_MINUTES', 'SMS_SENT', 'MMS_SENT', 'PHONE_NUMBER');

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Usage details
  type usage_type NOT NULL,
  quantity DECIMAL(10,4) NOT NULL, -- Minutes, count, etc.
  unit_cost DECIMAL(10,4),
  total_cost DECIMAL(10,4),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Reference
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,

  -- Billing period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_period (period_start, period_end),
  INDEX idx_type (type)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TYPE notification_type AS ENUM ('CALL_MISSED', 'MESSAGE_RECEIVED', 'VOICEMAIL', 'BILLING', 'SYSTEM');

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Notification details
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,

  -- Data payload
  data JSONB,

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Push notification
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_read (read),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- DEVICE TOKENS (Push Notifications)
-- ============================================

CREATE TYPE device_platform AS ENUM ('IOS', 'ANDROID');

CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Device info
  platform device_platform NOT NULL,
  token TEXT UNIQUE NOT NULL,
  device_id VARCHAR(255) UNIQUE,
  device_name VARCHAR(255),

  -- FCM/APNS
  fcm_token TEXT, -- Firebase Cloud Messaging (Android)
  apns_token TEXT, -- Apple Push Notification (iOS)
  voip_token TEXT, -- iOS VoIP push

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_device_id (device_id)
);

-- ============================================
-- WEBHOOKS LOG (pour debug Twilio)
-- ============================================

CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook details
  source VARCHAR(50), -- 'twilio', 'stripe'
  event_type VARCHAR(100),

  -- Request
  method VARCHAR(10),
  url TEXT,
  headers JSONB,
  body JSONB,

  -- Response
  status_code INTEGER,
  response_body JSONB,

  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_source (source),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  INDEX idx_processed (processed)
);
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum SubscriptionTier {
  FREE
  STARTER
  BUSINESS
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  TRIALING
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  phoneNumber   String?  @map("phone_number")
  passwordHash  String   @map("password_hash")
  firstName     String?  @map("first_name")
  lastName      String?  @map("last_name")
  role          UserRole @default(USER)

  // 2FA
  twoFaEnabled  Boolean @default(false) @map("two_fa_enabled")
  twoFaSecret   String? @map("two_fa_secret")

  // Profile
  avatarUrl     String?  @map("avatar_url")
  companyName   String?  @map("company_name")
  timezone      String   @default("Europe/Paris")

  // Status
  emailVerified Boolean  @default(false) @map("email_verified")
  isActive      Boolean  @default(true) @map("is_active")
  lastLogin     DateTime? @map("last_login")

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  refreshTokens RefreshToken[]
  phoneNumbers  PhoneNumber[]
  contacts      Contact[]
  calls         Call[]
  messages      Message[]
  subscription  Subscription?
  invoices      Invoice[]
  usageRecords  UsageRecord[]
  notifications Notification[]
  deviceTokens  DeviceToken[]

  @@map("users")
  @@index([email])
  @@index([phoneNumber])
}

model RefreshToken {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  token      String   @unique
  deviceId   String?  @map("device_id")
  deviceName String?  @map("device_name")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")

  expiresAt  DateTime @map("expires_at")
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("refresh_tokens")
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}

enum NumberStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
}

enum NumberType {
  LOCAL
  MOBILE
  TOLL_FREE
}

model PhoneNumber {
  id          String       @id @default(uuid())
  userId      String       @map("user_id")
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  phoneNumber String       @unique @map("phone_number")
  friendlyName String?     @map("friendly_name")
  countryCode String       @map("country_code")
  numberType  NumberType   @default(LOCAL) @map("number_type")

  twilioSid   String       @unique @map("twilio_sid")
  twilioCapabilities Json? @map("twilio_capabilities")

  status      NumberStatus @default(ACTIVE)
  purchasedAt DateTime     @default(now()) @map("purchased_at")
  expiresAt   DateTime?    @map("expires_at")

  monthlyCost Decimal      @map("monthly_cost") @db.Decimal(10, 2)

  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  // Relations
  usageRecords UsageRecord[]

  @@map("phone_numbers")
  @@index([userId])
  @@index([phoneNumber])
  @@index([status])
}

model Contact {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  firstName   String?  @map("first_name")
  lastName    String?  @map("last_name")
  phoneNumber String   @map("phone_number")
  email       String?
  company     String?
  notes       String?

  tags        String[]
  isFavorite  Boolean  @default(false) @map("is_favorite")

  avatarUrl   String?  @map("avatar_url")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  calls       Call[]
  messages    Message[]

  @@unique([userId, phoneNumber])
  @@map("contacts")
  @@index([userId])
  @@index([phoneNumber])
}

enum CallDirection {
  INBOUND
  OUTBOUND
}

enum CallStatus {
  QUEUED
  RINGING
  IN_PROGRESS
  COMPLETED
  FAILED
  BUSY
  NO_ANSWER
  CANCELLED
}

model Call {
  id         String        @id @default(uuid())
  userId     String        @map("user_id")
  user       User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  contactId  String?       @map("contact_id")
  contact    Contact?      @relation(fields: [contactId], references: [id], onDelete: SetNull)

  fromNumber String        @map("from_number")
  toNumber   String        @map("to_number")
  direction  CallDirection
  status     CallStatus

  twilioCallSid String?    @unique @map("twilio_call_sid")

  startedAt  DateTime?    @map("started_at")
  answeredAt DateTime?    @map("answered_at")
  endedAt    DateTime?    @map("ended_at")
  durationSeconds Int      @default(0) @map("duration_seconds")
  billableDurationSeconds Int @default(0) @map("billable_duration_seconds")

  cost       Decimal?     @db.Decimal(10, 4)
  costCurrency String     @default("EUR") @map("cost_currency")

  recordingUrl String?    @map("recording_url")
  recordingDurationSeconds Int? @map("recording_duration_seconds")

  userAgent  String?      @map("user_agent")
  qualityScore Int?       @map("quality_score")

  createdAt  DateTime     @default(now()) @map("created_at")
  updatedAt  DateTime     @updatedAt @map("updated_at")

  // Relations
  usageRecords UsageRecord[]

  @@map("calls")
  @@index([userId])
  @@index([contactId])
  @@index([fromNumber])
  @@index([toNumber])
  @@index([startedAt])
  @@index([status])
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum MessageStatus {
  QUEUED
  SENDING
  SENT
  DELIVERED
  FAILED
  RECEIVED
}

enum MessageType {
  SMS
  MMS
}

model Message {
  id             String           @id @default(uuid())
  userId         String           @map("user_id")
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  conversationId String?          @map("conversation_id")
  contactId      String?          @map("contact_id")
  contact        Contact?         @relation(fields: [contactId], references: [id], onDelete: SetNull)

  fromNumber     String           @map("from_number")
  toNumber       String           @map("to_number")
  direction      MessageDirection
  type           MessageType      @default(SMS)

  body           String?
  mediaUrls      String[]         @map("media_urls")

  twilioMessageSid String?        @unique @map("twilio_message_sid")
  status         MessageStatus
  errorCode      Int?             @map("error_code")
  errorMessage   String?          @map("error_message")

  isEncrypted    Boolean          @default(true) @map("is_encrypted")
  encryptionKeyId String?         @map("encryption_key_id")

  sentAt         DateTime?        @map("sent_at")
  deliveredAt    DateTime?        @map("delivered_at")
  readAt         DateTime?        @map("read_at")

  cost           Decimal?         @db.Decimal(10, 4)
  costCurrency   String           @default("EUR") @map("cost_currency")

  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  // Relations
  usageRecords   UsageRecord[]

  @@map("messages")
  @@index([userId])
  @@index([conversationId])
  @@index([contactId])
  @@index([fromNumber])
  @@index([toNumber])
  @@index([createdAt])
}

model Subscription {
  id                   String             @id @default(uuid())
  userId               String             @unique @map("user_id")
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  stripeCustomerId     String             @unique @map("stripe_customer_id")
  stripeSubscriptionId String?            @unique @map("stripe_subscription_id")
  stripePriceId        String?            @map("stripe_price_id")

  tier                 SubscriptionTier
  status               SubscriptionStatus @default(TRIALING)

  trialEndsAt          DateTime?          @map("trial_ends_at")
  currentPeriodStart   DateTime           @map("current_period_start")
  currentPeriodEnd     DateTime           @map("current_period_end")
  cancelledAt          DateTime?          @map("cancelled_at")
  cancelAtPeriodEnd    Boolean            @default(false) @map("cancel_at_period_end")

  amount               Decimal            @db.Decimal(10, 2)
  currency             String             @default("EUR")

  createdAt            DateTime           @default(now()) @map("created_at")
  updatedAt            DateTime           @updatedAt @map("updated_at")

  // Relations
  invoices             Invoice[]
  usageRecords         UsageRecord[]

  @@map("subscriptions")
  @@index([userId])
  @@index([stripeCustomerId])
  @@index([status])
}

model Invoice {
  id               String        @id @default(uuid())
  userId           String        @map("user_id")
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId   String?       @map("subscription_id")
  subscription     Subscription? @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)

  stripeInvoiceId  String        @unique @map("stripe_invoice_id")

  amountDue        Decimal       @map("amount_due") @db.Decimal(10, 2)
  amountPaid       Decimal       @default(0) @map("amount_paid") @db.Decimal(10, 2)
  currency         String        @default("EUR")
  status           String

  lineItems        Json?         @map("line_items")

  invoiceDate      DateTime      @map("invoice_date")
  dueDate          DateTime?     @map("due_date")
  paidAt           DateTime?     @map("paid_at")

  invoicePdfUrl    String?       @map("invoice_pdf_url")

  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  @@map("invoices")
  @@index([userId])
  @@index([subscriptionId])
  @@index([status])
}

enum UsageType {
  CALL_MINUTES
  SMS_SENT
  MMS_SENT
  PHONE_NUMBER
}

model UsageRecord {
  id             String        @id @default(uuid())
  userId         String        @map("user_id")
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId String?       @map("subscription_id")
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)

  type           UsageType
  quantity       Decimal       @db.Decimal(10, 4)
  unitCost       Decimal?      @map("unit_cost") @db.Decimal(10, 4)
  totalCost      Decimal?      @map("total_cost") @db.Decimal(10, 4)
  currency       String        @default("EUR")

  callId         String?       @map("call_id")
  call           Call?         @relation(fields: [callId], references: [id], onDelete: SetNull)
  messageId      String?       @map("message_id")
  message        Message?      @relation(fields: [messageId], references: [id], onDelete: SetNull)
  phoneNumberId  String?       @map("phone_number_id")
  phoneNumber    PhoneNumber?  @relation(fields: [phoneNumberId], references: [id], onDelete: SetNull)

  periodStart    DateTime      @map("period_start")
  periodEnd      DateTime      @map("period_end")

  createdAt      DateTime      @default(now()) @map("created_at")

  @@map("usage_records")
  @@index([userId])
  @@index([subscriptionId])
  @@index([periodStart, periodEnd])
  @@index([type])
}

enum NotificationType {
  CALL_MISSED
  MESSAGE_RECEIVED
  VOICEMAIL
  BILLING
  SYSTEM
}

model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      NotificationType
  title     String
  body      String?

  data      Json?

  read      Boolean          @default(false)
  readAt    DateTime?        @map("read_at")

  pushSent  Boolean          @default(false) @map("push_sent")
  pushSentAt DateTime?       @map("push_sent_at")

  createdAt DateTime         @default(now()) @map("created_at")

  @@map("notifications")
  @@index([userId])
  @@index([read])
  @@index([createdAt])
}

enum DevicePlatform {
  IOS
  ANDROID
}

model DeviceToken {
  id          String         @id @default(uuid())
  userId      String         @map("user_id")
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  platform    DevicePlatform
  token       String         @unique
  deviceId    String         @unique @map("device_id")
  deviceName  String?        @map("device_name")

  fcmToken    String?        @map("fcm_token")
  apnsToken   String?        @map("apns_token")
  voipToken   String?        @map("voip_token")

  isActive    Boolean        @default(true) @map("is_active")
  lastUsedAt  DateTime       @default(now()) @map("last_used_at")

  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  @@map("device_tokens")
  @@index([userId])
  @@index([token])
  @@index([deviceId])
}

model WebhookLog {
  id           String    @id @default(uuid())

  source       String
  eventType    String    @map("event_type")

  method       String
  url          String
  headers      Json?
  body         Json?

  statusCode   Int?      @map("status_code")
  responseBody Json?     @map("response_body")

  processed    Boolean   @default(false)
  processedAt  DateTime? @map("processed_at")
  error        String?

  createdAt    DateTime  @default(now()) @map("created_at")

  @@map("webhook_logs")
  @@index([source])
  @@index([eventType])
  @@index([createdAt])
  @@index([processed])
}
```

---

## 📱 API Endpoints

### Auth Service (Port 3001)

```typescript
// ============================================
// AUTHENTICATION
// ============================================

POST   /api/auth/register
Body: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}
Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
}

POST   /api/auth/login
Body: {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}
Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
  requires2FA?: boolean;
}

POST   /api/auth/verify-2fa
Body: {
  email: string;
  code: string;
}
Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
}

POST   /api/auth/refresh
Body: {
  refreshToken: string;
}
Response: {
  accessToken: string;
  refreshToken: string;
}

POST   /api/auth/logout
Headers: Authorization: Bearer <token>
Body: {
  refreshToken: string;
}
Response: { success: boolean }

// ============================================
// 2FA MANAGEMENT
// ============================================

POST   /api/auth/2fa/enable
Headers: Authorization: Bearer <token>
Response: {
  secret: string;
  qrCode: string; // Data URL
  backupCodes: string[];
}

POST   /api/auth/2fa/confirm
Headers: Authorization: Bearer <token>
Body: {
  code: string;
}
Response: { success: boolean }

POST   /api/auth/2fa/disable
Headers: Authorization: Bearer <token>
Body: {
  code: string;
}
Response: { success: boolean }

// ============================================
// USER PROFILE
// ============================================

GET    /api/auth/me
Headers: Authorization: Bearer <token>
Response: User

PUT    /api/auth/me
Headers: Authorization: Bearer <token>
Body: {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  timezone?: string;
}
Response: User

PUT    /api/auth/change-password
Headers: Authorization: Bearer <token>
Body: {
  currentPassword: string;
  newPassword: string;
}
Response: { success: boolean }

// ============================================
// EMAIL VERIFICATION
// ============================================

POST   /api/auth/send-verification
Headers: Authorization: Bearer <token>
Response: { success: boolean }

GET    /api/auth/verify-email/:token
Response: { success: boolean }
```

### Numbers Service (Port 3002)

```typescript
// ============================================
// AVAILABLE NUMBERS (for purchase)
// ============================================

GET    /api/numbers/available
Headers: Authorization: Bearer <token>
Query: {
  countryCode: string; // 'FR', 'US', 'UK'
  type?: 'LOCAL' | 'MOBILE' | 'TOLL_FREE';
  areaCode?: string;
  contains?: string; // Search pattern
  limit?: number;
}
Response: {
  numbers: Array<{
    phoneNumber: string;
    friendlyName: string;
    countryCode: string;
    type: string;
    capabilities: {
      voice: boolean;
      sms: boolean;
      mms: boolean;
    };
    monthlyCost: number;
    setupCost: number;
  }>;
}

// ============================================
// MY NUMBERS
// ============================================

GET    /api/numbers/my-numbers
Headers: Authorization: Bearer <token>
Response: PhoneNumber[]

POST   /api/numbers/purchase
Headers: Authorization: Bearer <token>
Body: {
  phoneNumber: string;
  friendlyName?: string;
}
Response: PhoneNumber

PUT    /api/numbers/:numberId
Headers: Authorization: Bearer <token>
Body: {
  friendlyName?: string;
}
Response: PhoneNumber

DELETE /api/numbers/:numberId
Headers: Authorization: Bearer <token>
Response: { success: boolean }

// ============================================
// NUMBER PORTING (future)
// ============================================

POST   /api/numbers/port-request
Headers: Authorization: Bearer <token>
Body: {
  phoneNumber: string;
  currentProvider: string;
  accountNumber: string;
  pin?: string;
}
Response: {
  portRequestId: string;
  status: string;
  estimatedCompletionDate: string;
}
```

### Messaging Service (Port 3003)

```typescript
// ============================================
// CONVERSATIONS
// ============================================

GET    /api/messages/conversations
Headers: Authorization: Bearer <token>
Query: {
  limit?: number;
  offset?: number;
}
Response: {
  conversations: Array<{
    conversationId: string;
    contact: Contact | null;
    phoneNumber: string;
    lastMessage: Message;
    unreadCount: number;
    updatedAt: string;
  }>;
  total: number;
}

GET    /api/messages/conversation/:phoneNumber
Headers: Authorization: Bearer <token>
Query: {
  limit?: number;
  offset?: number;
}
Response: {
  messages: Message[];
  total: number;
}

// ============================================
// SEND/RECEIVE MESSAGES
// ============================================

POST   /api/messages/send
Headers: Authorization: Bearer <token>
Body: {
  from: string; // My number
  to: string;
  body?: string;
  mediaUrls?: string[]; // For MMS
}
Response: Message

// Webhook from Twilio (no auth)
POST   /api/messages/webhooks/incoming
Body: {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  // ... autres champs Twilio
}
Response: TwiML

POST   /api/messages/webhooks/status
Body: {
  MessageSid: string;
  MessageStatus: string;
  // ... autres champs Twilio
}
Response: { success: boolean }

// ============================================
// MESSAGE ACTIONS
// ============================================

PUT    /api/messages/:messageId/read
Headers: Authorization: Bearer <token>
Response: Message

DELETE /api/messages/:messageId
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

### Call Service (Port 3005)

```typescript
// ============================================
// CALLS
// ============================================

GET    /api/calls
Headers: Authorization: Bearer <token>
Query: {
  limit?: number;
  offset?: number;
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: 'COMPLETED' | 'MISSED' | 'FAILED';
  startDate?: string;
  endDate?: string;
}
Response: {
  calls: Call[];
  total: number;
}

GET    /api/calls/:callId
Headers: Authorization: Bearer <token>
Response: Call

// ============================================
// INITIATE CALL
// ============================================

POST   /api/calls/initiate
Headers: Authorization: Bearer <token>
Body: {
  from: string; // My number
  to: string;
}
Response: {
  callId: string;
  twilioCallSid: string;
  status: string;
}

// ============================================
// CALL ACTIONS
// ============================================

POST   /api/calls/:callId/hangup
Headers: Authorization: Bearer <token>
Response: { success: boolean }

POST   /api/calls/:callId/mute
Headers: Authorization: Bearer <token>
Body: { muted: boolean }
Response: { success: boolean }

POST   /api/calls/:callId/hold
Headers: Authorization: Bearer <token>
Body: { onHold: boolean }
Response: { success: boolean }

// ============================================
// TWILIO WEBHOOKS
// ============================================

POST   /api/calls/webhooks/voice
Body: Twilio Voice Webhook
Response: TwiML

POST   /api/calls/webhooks/status
Body: {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  // ... autres champs Twilio
}
Response: { success: boolean }
```

### Billing Service (Port 3004)

```typescript
// ============================================
// SUBSCRIPTION
// ============================================

GET    /api/billing/subscription
Headers: Authorization: Bearer <token>
Response: Subscription

POST   /api/billing/subscribe
Headers: Authorization: Bearer <token>
Body: {
  tier: 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  paymentMethodId: string; // Stripe Payment Method
}
Response: Subscription

PUT    /api/billing/upgrade
Headers: Authorization: Bearer <token>
Body: {
  tier: 'BUSINESS' | 'ENTERPRISE';
}
Response: Subscription

POST   /api/billing/cancel
Headers: Authorization: Bearer <token>
Body: {
  cancelAtPeriodEnd: boolean;
}
Response: Subscription

POST   /api/billing/reactivate
Headers: Authorization: Bearer <token>
Response: Subscription

// ============================================
// PAYMENT METHODS
// ============================================

GET    /api/billing/payment-methods
Headers: Authorization: Bearer <token>
Response: StripePaymentMethod[]

POST   /api/billing/payment-methods
Headers: Authorization: Bearer <token>
Body: {
  paymentMethodId: string;
  setAsDefault?: boolean;
}
Response: StripePaymentMethod

DELETE /api/billing/payment-methods/:id
Headers: Authorization: Bearer <token>
Response: { success: boolean }

// ============================================
// INVOICES
// ============================================

GET    /api/billing/invoices
Headers: Authorization: Bearer <token>
Query: {
  limit?: number;
  offset?: number;
}
Response: {
  invoices: Invoice[];
  total: number;
}

GET    /api/billing/invoices/:invoiceId
Headers: Authorization: Bearer <token>
Response: Invoice

GET    /api/billing/invoices/:invoiceId/pdf
Headers: Authorization: Bearer <token>
Response: PDF File

// ============================================
// USAGE
// ============================================

GET    /api/billing/usage/current
Headers: Authorization: Bearer <token>
Response: {
  period: {
    start: string;
    end: string;
  };
  usage: {
    callMinutes: number;
    smsSent: number;
    mmsSent: number;
    phoneNumbers: number;
  };
  costs: {
    total: number;
    breakdown: {
      calls: number;
      sms: number;
      mms: number;
      phoneNumbers: number;
    };
  };
  limits: {
    callMinutes: number;
    smsSent: number;
    mmsSent: number;
    phoneNumbers: number;
  };
}

GET    /api/billing/usage/history
Headers: Authorization: Bearer <token>
Query: {
  startDate: string;
  endDate: string;
}
Response: UsageRecord[]

// ============================================
// STRIPE WEBHOOKS
// ============================================

POST   /api/billing/webhooks/stripe
Headers: stripe-signature
Body: Stripe Event
Response: { success: boolean }
```

### Contacts Service (intégré dans Messaging/Call services)

```typescript
// ============================================
// CONTACTS
// ============================================

GET    /api/contacts
Headers: Authorization: Bearer <token>
Query: {
  search?: string;
  tags?: string[];
  favorites?: boolean;
  limit?: number;
  offset?: number;
}
Response: {
  contacts: Contact[];
  total: number;
}

GET    /api/contacts/:contactId
Headers: Authorization: Bearer <token>
Response: Contact

POST   /api/contacts
Headers: Authorization: Bearer <token>
Body: {
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  notes?: string;
  tags?: string[];
}
Response: Contact

PUT    /api/contacts/:contactId
Headers: Authorization: Bearer <token>
Body: Partial<Contact>
Response: Contact

DELETE /api/contacts/:contactId
Headers: Authorization: Bearer <token>
Response: { success: boolean }

// ============================================
// CONTACT SYNC (bulk import)
// ============================================

POST   /api/contacts/sync
Headers: Authorization: Bearer <token>
Body: {
  contacts: Array<{
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
  }>;
}
Response: {
  imported: number;
  updated: number;
  failed: number;
}
```

---

## 📱 Applications Mobiles

### Architecture iOS (Swift/SwiftUI)

```
CommPro-iOS/
├── App/
│   ├── CommProApp.swift              # Entry point
│   ├── AppDelegate.swift             # App lifecycle, push setup
│   └── SceneDelegate.swift           # Scene management
├── Core/
│   ├── API/
│   │   ├── APIClient.swift           # Networking base
│   │   ├── Endpoints.swift           # API routes
│   │   ├── AuthInterceptor.swift    # JWT injection
│   │   └── Models/                   # Codable models
│   ├── Auth/
│   │   ├── AuthManager.swift        # Token management
│   │   ├── KeychainService.swift    # Secure storage
│   │   └── BiometricAuth.swift      # Face ID / Touch ID
│   ├── Telephony/
│   │   ├── CallManager.swift        # CallKit integration
│   │   ├── AudioController.swift    # Audio session
│   │   └── TwilioVoiceClient.swift  # Twilio Voice SDK
│   ├── Messaging/
│   │   ├── MessageManager.swift     # SMS/MMS logic
│   │   ├── EncryptionService.swift  # E2E encryption
│   │   └── MediaUploader.swift      # MMS media upload
│   └── Push/
│       ├── PushManager.swift        # APNs + VoIP push
│       └── NotificationHandler.swift
├── Features/
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   ├── RegisterView.swift
│   │   ├── TwoFactorView.swift
│   │   └── LoginViewModel.swift
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   └── DashboardViewModel.swift
│   ├── Contacts/
│   │   ├── ContactListView.swift
│   │   ├── ContactDetailView.swift
│   │   ├── AddContactView.swift
│   │   └── ContactsViewModel.swift
│   ├── Messages/
│   │   ├── ConversationListView.swift
│   │   ├── ConversationView.swift
│   │   ├── MessageBubbleView.swift
│   │   └── MessagesViewModel.swift
│   ├── Calls/
│   │   ├── CallHistoryView.swift
│   │   ├── ActiveCallView.swift
│   │   ├── DialerView.swift
│   │   └── CallsViewModel.swift
│   ├── Numbers/
│   │   ├── MyNumbersView.swift
│   │   ├── BuyNumberView.swift
│   │   └── NumbersViewModel.swift
│   └── Settings/
│       ├── SettingsView.swift
│       ├── SubscriptionView.swift
│       └── SettingsViewModel.swift
├── Shared/
│   ├── Components/
│   │   ├── Buttons/
│   │   ├── TextFields/
│   │   ├── LoadingView.swift
│   │   └── ErrorView.swift
│   ├── Extensions/
│   │   ├── View+Extensions.swift
│   │   ├── String+Extensions.swift
│   │   └── Color+Theme.swift
│   └── Utilities/
│       ├── Constants.swift
│       ├── Logger.swift
│       └── Validator.swift
└── Resources/
    ├── Assets.xcassets/
    ├── Localizable.strings
    └── Info.plist
```

**Principales dépendances iOS :**
```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/twilio/twilio-voice-ios", from: "6.9.0"),
    .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
    .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "10.18.0"),
    .package(url: "https://github.com/stripe/stripe-ios", from: "23.18.0"),
    .package(url: "https://github.com/realm/realm-swift.git", from: "10.43.0"), // Local DB
]
```

### Architecture Android (Kotlin/Jetpack Compose)

```
CommPro-Android/
├── app/
│   └── src/main/
│       ├── java/com/commpro/
│       │   ├── CommProApplication.kt
│       │   ├── MainActivity.kt
│       │   ├── core/
│       │   │   ├── api/
│       │   │   │   ├── ApiClient.kt
│       │   │   │   ├── ApiService.kt
│       │   │   │   ├── AuthInterceptor.kt
│       │   │   │   └── models/
│       │   │   ├── auth/
│       │   │   │   ├── AuthManager.kt
│       │   │   │   ├── TokenStore.kt      # EncryptedSharedPreferences
│       │   │   │   └── BiometricManager.kt
│       │   │   ├── telephony/
│       │   │   │   ├── CallManager.kt     # Telecom Framework
│       │   │   │   ├── AudioManager.kt
│       │   │   │   └── TwilioVoiceClient.kt
│       │   │   ├── messaging/
│       │   │   │   ├── MessageManager.kt
│       │   │   │   ├── EncryptionService.kt
│       │   │   │   └── MediaUploader.kt
│       │   │   └── push/
│       │   │       ├── PushManager.kt     # FCM
│       │   │       └── NotificationHandler.kt
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   │   ├── LoginScreen.kt
│       │   │   │   ├── RegisterScreen.kt
│       │   │   │   └── LoginViewModel.kt
│       │   │   ├── dashboard/
│       │   │   │   ├── DashboardScreen.kt
│       │   │   │   └── DashboardViewModel.kt
│       │   │   ├── contacts/
│       │   │   │   ├── ContactListScreen.kt
│       │   │   │   ├── ContactDetailScreen.kt
│       │   │   │   └── ContactsViewModel.kt
│       │   │   ├── messages/
│       │   │   │   ├── ConversationListScreen.kt
│       │   │   │   ├── ConversationScreen.kt
│       │   │   │   └── MessagesViewModel.kt
│       │   │   ├── calls/
│       │   │   │   ├── CallHistoryScreen.kt
│       │   │   │   ├── ActiveCallScreen.kt
│       │   │   │   └── CallsViewModel.kt
│       │   │   ├── numbers/
│       │   │   │   ├── MyNumbersScreen.kt
│       │   │   │   ├── BuyNumberScreen.kt
│       │   │   │   └── NumbersViewModel.kt
│       │   │   └── settings/
│       │   │       ├── SettingsScreen.kt
│       │   │       ├── SubscriptionScreen.kt
│       │   │       └── SettingsViewModel.kt
│       │   ├── ui/
│       │   │   ├── components/
│       │   │   │   ├── buttons/
│       │   │   │   ├── textfields/
│       │   │   │   ├── LoadingView.kt
│       │   │   │   └── ErrorView.kt
│       │   │   └── theme/
│       │   │       ├── Color.kt
│       │   │       ├── Theme.kt
│       │   │       └── Type.kt
│       │   └── utils/
│       │       ├── Constants.kt
│       │       ├── Logger.kt
│       │       └── Validator.kt
│       └── res/
│           ├── drawable/
│           ├── values/
│           │   ├── strings.xml
│           │   ├── colors.xml
│           │   └── themes.xml
│           └── xml/
└── build.gradle.kts
```

**Principales dépendances Android :**
```kotlin
// build.gradle.kts (app)
dependencies {
    // Jetpack Compose
    implementation("androidx.compose.ui:ui:1.5.4")
    implementation("androidx.compose.material3:material3:1.1.2")
    implementation("androidx.activity:activity-compose:1.8.0")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")

    // Twilio Voice
    implementation("com.twilio:voice-android:6.3.+")

    // Firebase (Push)
    implementation("com.google.firebase:firebase-messaging:23.3.1")

    // Stripe
    implementation("com.stripe:stripe-android:20.33.0")

    // Room (Local DB)
    implementation("androidx.room:room-runtime:2.6.0")
    kapt("androidx.room:room-compiler:2.6.0")
    implementation("androidx.room:room-ktx:2.6.0")

    // Biometric
    implementation("androidx.biometric:biometric:1.1.0")

    // Encrypted Storage
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
```

### Écrans principaux (Wireframes conceptuels)

**1. Login / Register**
```
┌─────────────────────────────┐
│         CommPro Logo        │
│                             │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Password              │  │
│  └───────────────────────┘  │
│                             │
│  [ Login with Face ID ]     │
│                             │
│  ┌───────────────────────┐  │
│  │       Sign In         │  │
│  └───────────────────────┘  │
│                             │
│  Don't have an account?     │
│  Sign Up                    │
└─────────────────────────────┘
```

**2. Dashboard (Tabs: Messages, Calls, Contacts, Settings)**
```
┌─────────────────────────────┐
│  ☰  CommPro    🔔 📞        │
├─────────────────────────────┤
│                             │
│  Your Numbers:              │
│  ┌─────────────────────┐    │
│  │ +33 6 12 34 56 78  │    │
│  │ Main Number         │    │
│  └─────────────────────┘    │
│                             │
│  Recent Activity:           │
│  ┌─────────────────────┐    │
│  │ 📱 John Doe         │    │
│  │ Missed call         │    │
│  │ 2 min ago          │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 💬 Jane Smith       │    │
│  │ New message         │    │
│  │ 10 min ago         │    │
│  └─────────────────────┘    │
│                             │
├─────────────────────────────┤
│ 💬    📞    👥    ⚙️       │
└─────────────────────────────┘
```

**3. Conversations (Messages Tab)**
```
┌─────────────────────────────┐
│  ← Messages      🔍  +       │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 👤 John Doe            │ │
│ │ Can we meet tomorrow?  │ │
│ │ 10:23 AM          (2)  │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👤 Jane Smith          │ │
│ │ Thanks for your help!  │ │
│ │ Yesterday              │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👤 Bob Wilson          │ │
│ │ See you soon           │ │
│ │ 2 days ago             │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ 💬    📞    👥    ⚙️       │
└─────────────────────────────┘
```

**4. Conversation Detail**
```
┌─────────────────────────────┐
│ ← 👤 John Doe          📞 ℹ│
├─────────────────────────────┤
│                             │
│      ┌──────────────┐       │
│      │ Hi! How are │        │
│      │ you?        │        │
│      └──────────────┘       │
│          10:15 AM           │
│                             │
│  ┌──────────────┐           │
│  │ Great! You? │            │
│  └──────────────┘           │
│      10:16 AM               │
│                             │
│      ┌──────────────┐       │
│      │ Can we meet │        │
│      │ tomorrow?   │        │
│      └──────────────┘       │
│          10:23 AM ✓✓        │
│                             │
├─────────────────────────────┤
│ [Type a message...] 📎  🎤 │
└─────────────────────────────┘
```

**5. Active Call Screen**
```
┌─────────────────────────────┐
│                             │
│                             │
│        👤 John Doe          │
│                             │
│         00:02:15            │
│                             │
│      +33 6 12 34 56 78      │
│                             │
│                             │
│   🔇       📢       ⏸      │
│  Mute    Speaker    Hold    │
│                             │
│                             │
│   🔢    ➕    🎤    ⏹      │
│ Keypad  Add  Record  End    │
│                             │
│                             │
│        [  End Call  ]       │
│                             │
└─────────────────────────────┘
```

**6. Buy Number Screen**
```
┌─────────────────────────────┐
│ ← Buy a Phone Number        │
├─────────────────────────────┤
│ Country: [France 🇫🇷  ▼]    │
│                             │
│ Type: [ Local Numbers ▼ ]  │
│                             │
│ Area Code: [Optional]       │
│                             │
│ [ Search ]                  │
│                             │
│ Available Numbers:          │
│ ┌─────────────────────────┐ │
│ │ +33 1 23 45 67 89      │ │
│ │ Paris                   │ │
│ │ €2/month    [ Buy ]    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ +33 6 98 76 54 32      │ │
│ │ Mobile                  │ │
│ │ €5/month    [ Buy ]    │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

---

## 🗓️ Planning de Développement (10 semaines)

### Semaine 1-2: Setup & Auth Service

**Backend:**
- [x] Setup Railway project + PostgreSQL + Redis
- [x] Init NX monorepo (ou Turborepo)
- [x] Prisma schema + migrations
- [x] Auth Service:
  - Register/Login
  - JWT tokens (access 15min, refresh 7d)
  - 2FA avec speakeasy
  - Email verification avec Resend
  - Password reset
- [x] Docker setup (dev environment)
- [x] Environment variables structure

**Mobile:**
- [x] Init iOS project (SwiftUI, min iOS 15)
- [x] Init Android project (Jetpack Compose, min API 26)
- [x] Setup CI/CD (GitHub Actions)
- [x] Auth UI (Login, Register, 2FA)
- [x] Keychain/EncryptedSharedPreferences setup
- [x] API client base (Alamofire/Retrofit)

**Livrables:**
- ✅ Users peuvent créer compte et se connecter
- ✅ 2FA fonctionnel
- ✅ Tokens refresh automatique
- ✅ Biometric login (Face ID/Fingerprint)

### Semaine 3-4: Numbers Service + Twilio Integration

**Backend:**
- [x] Numbers Service
- [x] Twilio SDK integration
- [x] Buy/release numbers endpoints
- [x] Sync Twilio numbers → DB
- [x] Webhook handler pour statuts Twilio
- [x] Billing logic (track costs)

**Mobile:**
- [x] My Numbers screen
- [x] Buy Number flow:
  - Search by country/area
  - Preview capabilities
  - Purchase with Stripe
- [x] Number settings (friendly name, status)

**Livrables:**
- ✅ Users peuvent acheter numéro virtuel FR/US/UK
- ✅ Affichage dans app
- ✅ Coûts trackés dans usage_records

### Semaine 5-6: Messaging Service (SMS/MMS)

**Backend:**
- [x] Messaging Service
- [x] Send SMS/MMS (Twilio SDK)
- [x] Twilio webhook → incoming messages
- [x] Webhook → status updates (sent, delivered, failed)
- [x] E2E encryption (AES-256-GCM)
- [x] Conversations grouping
- [x] Socket.io real-time pour nouveaux messages
- [x] Media upload pour MMS (Cloudflare R2 ou S3)

**Mobile:**
- [x] Conversations list
- [x] Conversation screen (chat UI)
- [x] Message bubbles (sent/received)
- [x] Send text + media (MMS)
- [x] Real-time updates (Socket.io)
- [x] Push notifications (APNs/FCM)
- [x] Message status indicators (✓✓)
- [x] Media viewer (images, vidéos)

**Livrables:**
- ✅ Users peuvent envoyer/recevoir SMS
- ✅ Support MMS (images)
- ✅ Push notifications pour nouveaux messages
- ✅ Interface chat moderne
- ✅ Messages chiffrés E2E

### Semaine 7-8: Call Service + CallKit/Telecom

**Backend:**
- [x] Call Service
- [x] Twilio Voice integration
- [x] Initiate outbound calls
- [x] Handle inbound calls (webhook)
- [x] Call status updates
- [x] Call history
- [x] Cost tracking

**Mobile iOS:**
- [x] Twilio Voice SDK integration
- [x] CallKit integration:
  - Native call UI
  - Lock screen controls
  - Recent calls in Phone app
- [x] PushKit (VoIP push)
- [x] Dialer screen
- [x] Active call screen:
  - Mute/unmute
  - Speaker on/off
  - Hold
  - Keypad (DTMF)
- [x] Call history screen
- [x] Background audio permissions

**Mobile Android:**
- [x] Twilio Voice SDK integration
- [x] Telecom Framework integration:
  - Self-managed connection
  - System call UI
- [x] Dialer screen
- [x] Active call screen (même features iOS)
- [x] Call history screen
- [x] Foreground service pour appels

**Livrables:**
- ✅ Users peuvent passer/recevoir appels
- ✅ UI native système (CallKit/Telecom)
- ✅ Qualité audio HD
- ✅ VoIP push (notifications même app fermée)
- ✅ Historique des appels

### Semaine 9: Contacts + Billing Service

**Backend:**
- [x] Contacts endpoints (CRUD)
- [x] Contact sync (bulk import)
- [x] Tags management
- [x] Billing Service:
  - Stripe integration
  - Subscription CRUD
  - Webhook handler (invoice.paid, etc.)
  - Usage tracking aggregation
  - Invoice generation

**Mobile:**
- [x] Contacts list
- [x] Contact detail screen
- [x] Add/edit contact
- [x] Contact sync from phone
- [x] Search & filters (tags, favorites)
- [x] Subscription management screen
- [x] Payment methods
- [x] Usage dashboard
- [x] Invoices list

**Livrables:**
- ✅ Gestion complète contacts
- ✅ Sync contacts téléphone → app
- ✅ Système d'abonnement fonctionnel
- ✅ Paiements Stripe
- ✅ Facturation automatique

### Semaine 10: Polish, Tests, Déploiement

**Backend:**
- [x] Load testing (k6 ou Artillery)
- [x] Security audit (OWASP)
- [x] Rate limiting (express-rate-limit)
- [x] Monitoring setup (Sentry, DataDog)
- [x] Logging centralisé (Winston + Loki)
- [x] Documentation API (Swagger)
- [x] Deploy to Railway (production)

**Mobile:**
- [x] UI/UX polish
- [x] Dark mode support
- [x] Accessibility (VoiceOver/TalkBack)
- [x] Error handling improvements
- [x] Offline mode (cached data)
- [x] Unit tests (critical paths)
- [x] Beta testing (TestFlight/Internal Testing)

**Livrables:**
- ✅ Apps iOS et Android en beta
- ✅ Backend production-ready sur Railway
- ✅ Documentation complète
- ✅ Monitoring actif

---

## 💰 Budget Détaillé Phase 1

### Coûts de Développement

**Option A: Développeur solo (fullstack + mobile)**
- Taux: €500/jour
- Durée: 50 jours (10 semaines x 5 jours)
- **Total: €25,000**

**Option B: 2 développeurs (backend + mobile)**
- Taux: €450/jour chacun
- Durée: 25 jours chacun (parallélisation)
- **Total: €22,500**

**Option C: Freelance (plus accessible)**
- Taux: €350/jour
- Durée: 50 jours
- **Total: €17,500**

**💡 Recommandé pour budget serré: Option C avec budget de €10,000**
- Réduire scope: Skip 2FA en Phase 1
- Simplifier UI: Templates UI kit au lieu de custom
- Une seule plateforme mobile d'abord (iOS OU Android)
- = 28 jours de dev à €350/j

### Coûts Opérationnels Mensuels (Phase 1)

**Infrastructure (Railway avec votre compte existant)**
```
PostgreSQL (Shared):           €5/mois
Redis (Shared):                €5/mois
5 x Services Node.js:          €20/mois (€4 x 5)
─────────────────────────────────────
Total Infrastructure:         €30/mois
```

**Services tiers**
```
Twilio:
  - Phone number (FR):         €2/mois par numéro
  - Appels sortants:           €0.01/min
  - SMS sortants:              €0.07/SMS
  - SMS entrants:              Gratuit
  → Estimation 1000 users:     €2,000/mois

Stripe (3% + €0.25):           Variable (sur revenus)

Resend (emails):
  - 3,000 emails/mois:         Gratuit
  - 50,000 emails/mois:        €20/mois

Firebase (push notifications):
  - Gratuit jusqu'à 10M/mois

CloudFlare (CDN + DDoS):
  - Gratuit (plan Free)
─────────────────────────────────────
Total Services:              ~€2,020/mois à 1000 users
```

**Total Phase 1 mensuel: €2,050/mois (à 1000 users)**

### Scaling Costs

**À 100 users:**
- Infrastructure: €30
- Twilio: €200
- **Total: €230/mois**

**À 500 users:**
- Infrastructure: €30
- Twilio: €1,000
- **Total: €1,030/mois**

**À 1,000 users:**
- Infrastructure: €30
- Twilio: €2,000
- **Total: €2,030/mois**

**À 5,000 users:**
- Infrastructure: €80 (upgrade DB + Redis)
- Twilio: €10,000
- **Total: €10,080/mois**

**À 10,000 users:**
- Infrastructure: €150
- Twilio: €20,000
- Resend: €50
- **Total: €20,200/mois**

---

## 💵 Pricing Plans

### Plan Gratuit (Free)
```
Prix: €0/mois
Limitations:
- 1 numéro virtuel uniquement
- 50 SMS/mois
- 50 minutes d'appels/mois
- Pas de MMS
- Historique 30 jours
- Support email uniquement

Objectif: Acquisition, conversion vers Starter
```

### Plan Starter
```
Prix: €12/mois (facturé annuellement)
ou €15/mois (mensuel)

Inclus:
- 1 numéro virtuel
- 500 SMS/mois
- 500 minutes d'appels/mois
- 100 MMS/mois
- Historique illimité
- E2E encryption
- Support email (24h)
- API access

Au-delà: Pay-as-you-go
- SMS: €0.10
- Appel: €0.02/min
- MMS: €0.15

Cible: Freelances, solopreneurs
```

### Plan Business
```
Prix: €29/mois (facturé annuellement)
ou €35/mois (mensuel)

Inclus:
- 3 numéros virtuels
- 2,000 SMS/mois
- 2,000 minutes d'appels/mois
- 500 MMS/mois
- Multi-device (iOS + Android simultanés)
- Call recording (Phase 2)
- Analytics basiques
- Support prioritaire (email + chat)
- API access
- Webhooks

Au-delà: Pay-as-you-go (tarifs réduits)
- SMS: €0.08
- Appel: €0.015/min
- MMS: €0.12
- Numéro additionnel: +€5/mois

Cible: PME, équipes 1-10
```

### Plan Enterprise
```
Prix: €99/mois (facturé annuellement)
ou €119/mois (mensuel)

Inclus:
- 10 numéros virtuels
- 10,000 SMS/mois
- 10,000 minutes d'appels/mois
- 2,000 MMS/mois
- Multi-users (jusqu'à 5 users)
- Call recording illimité
- Analytics avancés
- SLA 99.9%
- Support prioritaire (24/7 chat + phone)
- API access illimité
- Webhooks
- Custom integrations (Zapier, etc.)
- Dedicated account manager

Au-delà: Tarifs négociés
Numéro additionnel: +€4/mois
User additionnel: +€15/mois

Cible: Grandes entreprises, call centers
```

### Estimation Revenus

**Scénario conservateur (après 12 mois):**
```
100 Free users      → €0
200 Starter users   → €2,400/mois (€12 x 200)
80 Business users   → €2,320/mois (€29 x 80)
20 Enterprise users → €1,980/mois (€99 x 20)
──────────────────────────────────────────
Total: 400 users    → €6,700/mois MRR
                      €80,400/an ARR

Coûts (400 users):    €1,000/mois
Profit net:           €5,700/mois
Marge:                85%
```

**Scénario optimiste (après 18 mois):**
```
500 Free users       → €0
1,000 Starter users  → €12,000/mois
400 Business users   → €11,600/mois
100 Enterprise users → €9,900/mois
──────────────────────────────────────────
Total: 2,000 users   → €33,500/mois MRR
                       €402,000/an ARR

Coûts (2,000 users):   €5,000/mois
Profit net:            €28,500/mois
Marge:                 85%
```

---

## 🚀 Déploiement & DevOps

### Structure Railway

```
Project: CommPro-Production
├── Services:
│   ├── auth-service (Port 3001)
│   │   ├── Build: Dockerfile
│   │   ├── Env: NODE_ENV=production
│   │   └── Health: /health
│   ├── numbers-service (Port 3002)
│   ├── messaging-service (Port 3003)
│   ├── billing-service (Port 3004)
│   ├── call-service (Port 3005)
│   └���─ nginx-proxy (Port 80/443)
│       ├── SSL: Let's Encrypt auto
│       └── Load balancing
├── PostgreSQL:
│   ├── Plan: Shared ($5) → Dedicated ($15) at 500 users
│   ├── Backup: Automated daily
│   └── Connection pooling: PgBouncer
└── Redis:
    ├── Plan: Shared ($5) → Dedicated ($15) at 500 users
    └── Persistence: RDB + AOF
```

### Environment Variables (exemple)

```bash
# ============================================
# GLOBAL
# ============================================
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:pass@host:5432/commpro_prod
REDIS_URL=redis://user:pass@host:6379

# ============================================
# JWT
# ============================================
JWT_SECRET=<strong_random_secret_256_bits>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<another_strong_secret>
REFRESH_TOKEN_EXPIRES_IN=7d

# ============================================
# INTERNAL SERVICE AUTH
# ============================================
INTERNAL_SERVICE_SECRET=<service_to_service_secret>

# ============================================
# TWILIO
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33612345678
TWILIO_WEBHOOK_BASE_URL=https://api.commpro.io

# ============================================
# STRIPE
# ============================================
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxxxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxxxxxxxxxxxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxxxxxx

# ============================================
# FIREBASE (Push Notifications)
# ============================================
FIREBASE_PROJECT_ID=commpro-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@commpro-prod.iam.gserviceaccount.com

# ============================================
# RESEND (Emails)
# ============================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@commpro.io

# ============================================
# CLOUDFLARE (CDN - optionnel)
# ============================================
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxx
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxx
CLOUDFLARE_R2_BUCKET=commpro-media

# ============================================
# SENTRY (Monitoring)
# ============================================
SENTRY_DSN=https://xxxxxx@o00000.ingest.sentry.io/0000000

# ============================================
# APP URLs
# ============================================
API_BASE_URL=https://api.commpro.io
WEB_APP_URL=https://app.commpro.io
MOBILE_DEEP_LINK_SCHEME=commpro://
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: auth-service
      # Répéter pour chaque service

  deploy-mobile-ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build iOS
        run: |
          cd ios
          fastlane beta
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}

  deploy-mobile-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Android
        run: |
          cd android
          ./gradlew bundleRelease
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: io.commpro.app
          releaseFiles: android/app/build/outputs/bundle/release/*.aab
          track: beta
```

---

## 🧪 Tests

### Backend Testing Strategy

```typescript
// tests/auth-service/login.test.ts
import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/lib/prisma';

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toHaveProperty('email', 'test@example.com');
  });

  it('should return 401 with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});
```

**Coverage cible: 80%+ pour services critiques (auth, billing)**

### Mobile Testing (iOS)

```swift
// Tests/CommProTests/AuthViewModelTests.swift
import XCTest
@testable import CommPro

class AuthViewModelTests: XCTestCase {
    var viewModel: LoginViewModel!
    var mockAPIClient: MockAPIClient!

    override func setUp() {
        super.setUp()
        mockAPIClient = MockAPIClient()
        viewModel = LoginViewModel(apiClient: mockAPIClient)
    }

    func testLoginSuccess() async throws {
        // Given
        mockAPIClient.loginResult = .success(AuthResponse(
            user: User(id: "123", email: "test@example.com"),
            accessToken: "token123",
            refreshToken: "refresh123"
        ))

        // When
        await viewModel.login(email: "test@example.com", password: "password")

        // Then
        XCTAssertTrue(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testLoginFailure() async throws {
        // Given
        mockAPIClient.loginResult = .failure(.invalidCredentials)

        // When
        await viewModel.login(email: "test@example.com", password: "wrong")

        // Then
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNotNil(viewModel.errorMessage)
    }
}
```

---

## 📊 Monitoring & Observability

### Sentry Integration

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% des transactions
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
});

// Middleware Express
export const sentryErrorHandler = Sentry.Handlers.errorHandler();
export const sentryRequestHandler = Sentry.Handlers.requestHandler();
```

### Logging

```typescript
// src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('User logged in', { userId: '123', email: 'test@example.com' });
logger.error('Failed to send SMS', { error, to: '+33612345678' });
```

### Health Checks

```typescript
// src/routes/health.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

const router = Router();

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    services: {
      database: 'OK',
      redis: 'OK',
      twilio: 'OK',
    },
  };

  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    health.services.database = 'ERROR';
    health.status = 'DEGRADED';
  }

  try {
    // Check Redis
    await redis.ping();
  } catch (error) {
    health.services.redis = 'ERROR';
    health.status = 'DEGRADED';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

---

## 🔐 Sécurité

### Best Practices Implémentées

**1. Authentication & Authorization**
- JWT avec expiration courte (15 min)
- Refresh tokens avec rotation
- 2FA optionnel (TOTP)
- Rate limiting sur login (5 tentatives/15 min)
- Biometric auth sur mobile

**2. Data Protection**
- HTTPS uniquement (TLS 1.3)
- E2E encryption messages (AES-256-GCM)
- Passwords: bcrypt (12 rounds)
- Tokens: cryptographically secure random
- PII encryption at rest

**3. API Security**
- Rate limiting global (100 req/min/IP)
- Input validation (Zod schemas)
- SQL injection protection (Prisma)
- XSS protection (helmet.js)
- CORS configuré strictement
- Webhook signature verification (Twilio, Stripe)

**4. Mobile Security**
- Certificate pinning (API)
- Jailbreak/root detection
- Secure storage (Keychain/EncryptedSharedPreferences)
- Code obfuscation (ProGuard/SwiftShield)
- No sensitive data in logs

**5. Compliance**
- GDPR: Data export/deletion
- PCI DSS: Stripe gère les cartes (Level 1)
- eIDAS: Signature électronique (si applicable)
- RGPD: Consentement + DPO

---

## 📚 Documentation

### API Documentation (Swagger)

```typescript
// src/swagger.ts
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CommPro API',
      version: '1.0.0',
      description: 'Professional communication platform API',
    },
    servers: [
      {
        url: 'https://api.commpro.io',
        description: 'Production',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export { swaggerDocs, swaggerUi };

// Dans index.ts
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
```

### README Structure

```markdown
# CommPro - Professional Communication Platform

## 📋 Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🚀 Features
- Virtual phone numbers (FR, US, UK, DE, ES, IT)
- HD voice calls with CallKit/Telecom integration
- SMS/MMS with E2E encryption
- Smart contact management
- Real-time synchronization
- Subscription billing (Stripe)
- Push notifications (APNs/FCM)
- Multi-device support

## 🏗️ Architecture
[Voir schéma architecture]

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Twilio account
- Stripe account

### Installation
...
```

---

## 🎯 Métriques de Succès (KPIs)

### Technique
- Uptime: >99.5%
- API latency p95: <200ms
- Call quality MOS: >4.0
- Push notification delivery: >95%
- Crash rate: <0.1%

### Business
- Conversion Free → Starter: >15%
- Conversion Starter → Business: >10%
- Churn rate: <5%/mois
- NPS (Net Promoter Score): >50
- CAC (Customer Acquisition Cost): <€50
- LTV (Lifetime Value): >€500

### Engagement
- DAU/MAU ratio: >40%
- Appels/user/semaine: >10
- Messages/user/jour: >20
- Session duration moyenne: >5 min

---

## 🚨 Risques & Mitigation

### Risque 1: Coûts Twilio élevés
**Impact**: Erosion marges si usage > prévisions
**Probabilité**: Moyenne
**Mitigation**:
- Rate limiting stricte (max 1000 SMS/jour/user gratuit)
- Alertes usage anormal
- Blocage automatique spam
- Négocier volume pricing avec Twilio à 1000+ users

### Risque 2: Qualité appels médiocre
**Impact**: Churn élevé
**Probabilité**: Faible
**Mitigation**:
- Tests réseau (latency, jitter, packet loss)
- Fallback codecs (Opus → PCMU)
- Monitoring qualité MOS en temps réel
- Twilio Super Network (routing intelligent)

### Risque 3: Push notifications non reçues
**Impact**: Appels manqués, mauvaise UX
**Probabilité**: Moyenne (iOS battery optimization)
**Mitigation**:
- VoIP push (PushKit) pour iOS
- Foreground service Android
- Retry logic avec backoff exponentiel
- Monitoring delivery rate

### Risque 4: Fraude (spam, abuse)
**Impact**: Coûts supplémentaires, réputation
**Probabilité**: Moyenne
**Mitigation**:
- KYC soft (email + téléphone verification)
- Rate limiting agressif
- Honeypot numbers (détection bots)
- Blacklist/whitelist numéros
- Machine learning fraud detection (Phase 2)

### Risque 5: Concurrence (Twilio Flex, RingCentral)
**Impact**: Difficulté acquisition
**Probabilité**: Élevée
**Mitigation**:
- Pricing agressif (2x moins cher)
- UX supérieure (mobile-first)
- Niche focus (freelances, PME FR)
- Features différenciantes (E2E encryption)

---

## 🗺️ Roadmap Phase 2 (Mois 4-9)

### Fonctionnalités prioritaires
1. **Appels vidéo** (Semaine 11-14)
   - LiveKit integration
   - Group calls (jusqu'à 10 participants)
   - Screen sharing
   - Enregistrement vidéo

2. **Voicemail** (Semaine 15-16)
   - Transcription automatique (Deepgram)
   - Voicemail to email
   - Voicemail assistant (IA)

3. **Call recording** (Semaine 17)
   - Opt-in recording
   - Cloud storage (Cloudflare R2)
   - Partage enregistrements

4. **Analytics avancés** (Semaine 18-19)
   - Dashboard Business Intelligence
   - Export CSV/Excel
   - Custom reports
   - Call duration heatmaps

5. **Intégrations** (Semaine 20-22)
   - Zapier
   - Slack
   - HubSpot CRM
   - Salesforce
   - Calendly

6. **Team features** (Semaine 23-25)
   - Multi-users par compte
   - Roles & permissions
   - Call transfer
   - Call queues
   - IVR (Interactive Voice Response)

### Budget Phase 2
- Développement: €15,000 (6 semaines supplémentaires)
- Infrastructure: +€100/mois (LiveKit)
- **Total Phase 1 + Phase 2: €24,500 dev + €150/mois infra**

---

## 📞 Support & Maintenance

### Plan de Support

**Tier 1: Email Support (Free/Starter)**
- Response time: 24h
- Availability: Mon-Fri 9h-18h CET
- Channel: support@commpro.io

**Tier 2: Priority Support (Business)**
- Response time: 4h
- Availability: Mon-Fri 8h-20h CET
- Channels: Email + Live chat

**Tier 3: 24/7 Support (Enterprise)**
- Response time: 1h (critical), 4h (normal)
- Availability: 24/7/365
- Channels: Email + Live chat + Phone
- Dedicated account manager
- SLA 99.9% uptime

### Maintenance Continue

**Mensuel:**
- Security patches
- Dependency updates
- Performance monitoring
- Cost optimization
- Bug fixes

**Trimestriel:**
- Feature releases
- A/B testing nouvelles features
- User feedback implementation
- Infrastructure scaling

**Annuel:**
- Major version upgrades
- Security audit externe
- Penetration testing
- Technology stack review

---

## ✅ Checklist de Lancement

### Pré-lancement (J-30)

**Backend:**
- [ ] Tous les services déployés sur Railway
- [ ] Database migrations applied
- [ ] Environment variables configurées
- [ ] SSL certificates actifs
- [ ] Monitoring setup (Sentry)
- [ ] Logging centralisé
- [ ] Health checks fonctionnels
- [ ] Rate limiting configuré
- [ ] Webhooks Twilio/Stripe testés

**Mobile:**
- [ ] Apps iOS/Android buildées (release)
- [ ] TestFlight/Internal Testing beta ouverte
- [ ] 50+ beta testers inscrits
- [ ] Crash reporting setup (Sentry)
- [ ] Analytics setup (Firebase Analytics)
- [ ] Push notifications testées
- [ ] App Store/Play Store listings créés
- [ ] Screenshots et vidéos prêts

**Business:**
- [ ] Stripe products/prices créés
- [ ] Pricing page finalisée
- [ ] Terms of Service rédigés
- [ ] Privacy Policy rédigée
- [ ] Support email configuré
- [ ] Documentation utilisateur
- [ ] FAQ rédigée

### Lancement (J-0)

- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)
- [ ] Public announcement (Twitter, LinkedIn, Product Hunt)
- [ ] Landing page live
- [ ] Blog post lancement
- [ ] Email early adopters

### Post-lancement (J+7)

- [ ] Daily monitoring metrics
- [ ] User feedback collection
- [ ] Bug triage & fixes
- [ ] Onboarding optimization
- [ ] Conversion funnel analysis

---

## 🎓 Ressources & Références

### Documentation Technique
- [Twilio Voice SDK iOS](https://www.twilio.com/docs/voice/sdks/ios)
- [Twilio Voice SDK Android](https://www.twilio.com/docs/voice/sdks/android)
- [CallKit Apple Documentation](https://developer.apple.com/documentation/callkit)
- [Android Telecom Framework](https://developer.android.com/guide/topics/connectivity/telecom)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

### Exemples de Code
- [Twilio Voice Quickstart iOS](https://github.com/twilio/voice-quickstart-ios)
- [Twilio Voice Quickstart Android](https://github.com/twilio/voice-quickstart-android)
- [Stripe iOS SDK Examples](https://github.com/stripe/stripe-ios)

### Inspiration Design
- [Minari.io](https://minari.io) - UX épurée
- [OnOff](https://onoff.app) - Gestion numéros
- [Sideline](https://www.sideline.com) - Interface mobile
- [Dialpad](https://www.dialpad.com) - Features business

---

## 📧 Contact & Questions

**Développeur Principal:** [Votre nom]
**Email:** dev@commpro.io
**GitHub:** https://github.com/commpro/commpro
**Discord:** https://discord.gg/commpro

---

**Dernière mise à jour:** 2026-02-15
**Version du plan:** 1.0.0
**Statut:** Phase 1 - Prêt à démarrer 🚀
