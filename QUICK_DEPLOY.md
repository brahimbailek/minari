# ⚡ Déploiement Ultra-Rapide

## 🎯 Copy-Paste pour chaque service

### 1. Numbers Service

**Root Directory:**
```
apps/numbers-service
```

**Variables (Raw Editor):**
```env
PORT=3002
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=${{front.JWT_SECRET}}
INTERNAL_SERVICE_SECRET=${{front.INTERNAL_SERVICE_SECRET}}
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Watch Paths (3 lignes à ajouter):**
```
/apps/numbers-service/**
/packages/**
/Dockerfile.railway
```

---

### 2. Messaging Service

**Root Directory:**
```
apps/messaging-service
```

**Variables:**
```env
PORT=3003
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=${{front.JWT_SECRET}}
INTERNAL_SERVICE_SECRET=${{front.INTERNAL_SERVICE_SECRET}}
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ENCRYPTION_KEY=GENERE_UNE_CLE_256_BIT
```

**Génère ENCRYPTION_KEY:**
```bash
node scripts/generate-encryption-key.js
```

**Watch Paths:**
```
/apps/messaging-service/**
/packages/**
/Dockerfile.railway
```

---

### 3. Billing Service

**Root Directory:**
```
apps/billing-service
```

**Variables:**
```env
PORT=3004
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=${{front.JWT_SECRET}}
INTERNAL_SERVICE_SECRET=${{front.INTERNAL_SERVICE_SECRET}}
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxx
```

**Watch Paths:**
```
/apps/billing-service/**
/packages/**
/Dockerfile.railway
```

---

### 4. Call Service

**Root Directory:**
```
apps/call-service
```

**Variables:**
```env
PORT=3005
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=${{front.JWT_SECRET}}
INTERNAL_SERVICE_SECRET=${{front.INTERNAL_SERVICE_SECRET}}
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Watch Paths:**
```
/apps/call-service/**
/packages/**
/Dockerfile.railway
```

---

### 5. Dashboard

**Root Directory:**
```
apps/test-dashboard
```

**Variables:**
```env
PORT=3010
NODE_ENV=production
```

**Watch Paths:**
```
/apps/test-dashboard/**
```

---

## 🔗 Après Déploiement

**Récupère les URLs générées par Railway et mets à jour le dashboard :**

Édite `apps/test-dashboard/public/app.js` ligne 59-65 :

```javascript
const productionUrls = {
    'auth': 'https://front-production-9c45.up.railway.app',
    'numbers': 'https://numbers-production-XXXX.up.railway.app',
    'messaging': 'https://messaging-production-XXXX.up.railway.app',
    'billing': 'https://billing-production-XXXX.up.railway.app',
    'call': 'https://call-production-XXXX.up.railway.app'
};
```

Commit et push pour que le dashboard soit à jour ! 🚀
