# 🚀 Prochaines Étapes - CommPro Phase 1

Félicitations ! La structure de base du projet CommPro est en place. Voici les étapes pour continuer le développement.

---

## ✅ Ce qui est déjà fait

- ✅ **Structure monorepo** avec Turborepo
- ✅ **Architecture microservices** (5 services définis)
- ✅ **Schéma Prisma complet** avec tous les modèles (15+ tables)
- ✅ **Docker Compose** pour PostgreSQL + Redis
- ✅ **Auth Service** - Structure de base + routes + middlewares
- ✅ **Documentation** - README complet avec instructions
- ✅ **Commit initial** - Projet versionné avec Git

---

## 🎯 Étape 1: Installation et Vérification (30 min)

### 1.1 Installer les dépendances

```bash
cd C:\Users\Brahim\Desktop\CommPro

# Installer toutes les dépendances
npm install
```

### 1.2 Copier et configurer .env

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env et ajouter vos clés (pour l'instant, gardez les valeurs par défaut)
notepad .env
```

**Important:** Vous aurez besoin de:
- Twilio Account SID + Auth Token (gratuit: https://www.twilio.com/try-twilio)
- Stripe API keys (mode test gratuit: https://dashboard.stripe.com/test/apikeys)
- Firebase credentials (optionnel pour l'instant)

### 1.3 Démarrer l'infrastructure

```bash
# Démarrer PostgreSQL + Redis
npm run docker:up

# Vérifier que les conteneurs fonctionnent
docker ps
```

Vous devriez voir:
- `commpro-postgres` sur port 5432
- `commpro-redis` sur port 6379
- `commpro-adminer` sur port 8080

### 1.4 Setup de la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer la base de données et appliquer les migrations
npm run db:migrate

# (Optionnel) Ouvrir Prisma Studio pour voir la DB
npm run db:studio
# Ouvre http://localhost:5555
```

### 1.5 Tester l'Auth Service

```bash
# Démarrer l'Auth Service en mode dev
cd apps/auth-service
npm run dev
```

Tester le health check:
```bash
curl http://localhost:3001/health
```

Devrait retourner:
```json
{
  "status": "OK",
  "service": "auth-service",
  "timestamp": "2026-02-15T...",
  "uptime": 5.123
}
```

---

## 🎯 Étape 2: Implémenter Auth Service (Semaine 1, Jour 1-2)

### 2.1 Installer les dépendances manquantes

```bash
cd apps/auth-service

# Vérifier que tout est installé
npm install
```

### 2.2 Créer les utilitaires JWT

Créer `apps/auth-service/src/utils/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export const generateAccessToken = (userId: string, email: string, role: string) => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};
```

### 2.3 Implémenter le Register

Dans `authController.ts`, remplacer la fonction `register` par:

```typescript
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@commpro/database';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

register: async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Valider les données
    const data = registerSchema.parse(req.body);

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // Générer les tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Sauvegarder le refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        deviceId: req.headers['x-device-id'] as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid input: ' + error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
},
```

### 2.4 Tester le Register

```bash
# Démarrer l'Auth Service
npm run dev

# Dans un autre terminal, tester l'inscription
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Devrait retourner:
```json
{
  "user": {
    "id": "uuid...",
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### 2.5 Implémenter les autres endpoints

Suivre le même pattern pour:
- `login` - Vérifier email + password, générer tokens
- `refresh` - Vérifier refresh token, générer nouveau access token
- `me` - Retourner user depuis `req.user`
- `logout` - Supprimer refresh token de la DB

Référence: Voir le plan complet dans `COMMPRO-PHASE1-PLAN.md` section "API Endpoints".

---

## 🎯 Étape 3: Setup Twilio (Semaine 1, Jour 3)

### 3.1 Créer un compte Twilio

1. Aller sur https://www.twilio.com/try-twilio
2. S'inscrire (gratuit avec $15 de crédit)
3. Vérifier votre numéro de téléphone
4. Noter votre **Account SID** et **Auth Token**

### 3.2 Acheter un numéro test

1. Dans le dashboard Twilio: https://console.twilio.com/
2. Aller dans "Phone Numbers" > "Manage" > "Buy a number"
3. Choisir un numéro français (+33) ou américain (+1)
4. Activer les capabilities: **Voice**, **SMS**, **MMS**
5. Prix: ~€1/mois pour un numéro local

### 3.3 Configurer .env

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33612345678
```

---

## 🎯 Étape 4: Créer Numbers Service (Semaine 1, Jour 3-4)

### 4.1 Créer la structure

```bash
cd apps
mkdir -p numbers-service/src/{controllers,routes,middleware,services,utils}
```

### 4.2 Copier package.json de auth-service

```bash
cp auth-service/package.json numbers-service/package.json
```

Éditer et changer:
- `"name": "@commpro/numbers-service"`
- Ajouter dépendance: `"twilio": "^4.20.0"`

### 4.3 Créer index.ts

Copier la structure de `auth-service/src/index.ts` et changer:
- Port: `3002`
- Service name: `numbers-service`

### 4.4 Implémenter l'intégration Twilio

Créer `services/twilioService.ts`:

```typescript
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;

export const twilioClient = twilio(accountSid, authToken);

export const searchAvailableNumbers = async (
  countryCode: string,
  type: 'local' | 'mobile' | 'tollFree'
) => {
  const numbers = await twilioClient.availablePhoneNumbers(countryCode).local.list({
    limit: 20,
  });

  return numbers.map((num) => ({
    phoneNumber: num.phoneNumber,
    friendlyName: num.friendlyName,
    capabilities: num.capabilities,
  }));
};

export const purchaseNumber = async (phoneNumber: string) => {
  const number = await twilioClient.incomingPhoneNumbers.create({
    phoneNumber,
    voiceUrl: `${process.env.TWILIO_WEBHOOK_BASE_URL}/api/calls/webhooks/voice`,
    smsUrl: `${process.env.TWILIO_WEBHOOK_BASE_URL}/api/messages/webhooks/incoming`,
  });

  return {
    sid: number.sid,
    phoneNumber: number.phoneNumber,
    capabilities: number.capabilities,
  };
};
```

### 4.5 Créer les routes

Voir le plan complet dans `COMMPRO-PHASE1-PLAN.md` section "Numbers Service".

---

## 🎯 Étape 5: Planning Complet (10 semaines)

Suivre le planning détaillé dans `COMMPRO-PHASE1-PLAN.md`:

**Semaine 1-2:** Setup + Auth Service ✅ (en cours)
**Semaine 3-4:** Numbers Service + Twilio
**Semaine 5-6:** Messaging Service (SMS/MMS + E2E encryption)
**Semaine 7-8:** Call Service + CallKit/Telecom
**Semaine 9:** Contacts + Billing Service (Stripe)
**Semaine 10:** Polish + Tests + Déploiement

---

## 📚 Ressources

### Documentation
- **Plan complet:** `COMMPRO-PHASE1-PLAN.md`
- **README:** Instructions de setup et architecture
- **Twilio Docs:** https://www.twilio.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Prisma Docs:** https://www.prisma.io/docs

### Outils Utiles
- **Prisma Studio:** `npm run db:studio` - Interface UI pour la DB
- **Adminer:** http://localhost:8080 - PostgreSQL UI
- **Postman:** Pour tester les APIs
- **Twilio Console:** https://console.twilio.com

### Support
- **Questions techniques:** Voir le README et le plan complet
- **Twilio issues:** Support Twilio (gratuit)
- **Bugs Prisma:** https://github.com/prisma/prisma/issues

---

## 🎉 Bon développement !

Le projet est prêt à être développé. Commence par:

1. ✅ Installer les dépendances (`npm install`)
2. ✅ Démarrer Docker (`npm run docker:up`)
3. ✅ Setup la DB (`npm run db:generate && npm run db:migrate`)
4. 🔧 Implémenter Auth Service (register + login)
5. 🔧 Tester avec Postman
6. 🔧 Continuer avec Numbers Service

**Prochaine session:** On implémente les controllers de l'Auth Service ensemble ! 🚀
