# 🚀 Guide de Déploiement Railway - CommPro

Ce guide te permet de déployer tous les services backend sur Railway.

## 📋 Statut Actuel

✅ **Postgres** - Database
✅ **Redis** - Cache
✅ **front** (Auth Service) - `front-production-9c45.up.railway.app`

❌ **À déployer :**
- Numbers Service
- Messaging Service
- Billing Service
- Call Service
- Test Dashboard

---

## 🎯 Déploiement Rapide

### 1️⃣ Numbers Service

**Dans Railway :**
1. Click **"+ New"** → **"GitHub Repo"** → Sélectionne `brahimbailek/minari`
2. Nomme le service : **`numbers`**

**Settings → Root Directory:**
```
apps/numbers-service
```

**Settings → Variables → Raw Editor → Colle ça :**
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

**Settings → Networking:**
- Click **"Generate Domain"**
- Port: **3002**

**Settings → Build → Watch Paths → Add Pattern:**
```
/apps/numbers-service/**
```
```
/packages/**
```
```
/Dockerfile.railway
```

**Deploy !** 🚀

---

### 2️⃣ Messaging Service

**New Service :** `messaging`

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
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

> **ENCRYPTION_KEY :** Génère une clé 256-bit avec:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

**Generate Domain** (Port 3003)

**Watch Paths:**
```
/apps/messaging-service/**
/packages/**
/Dockerfile.railway
```

---

### 3️⃣ Billing Service

**New Service :** `billing`

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

> **Stripe Price IDs :** Créé les dans Stripe Dashboard → Products

**Generate Domain** (Port 3004)

**Watch Paths:**
```
/apps/billing-service/**
/packages/**
/Dockerfile.railway
```

---

### 4️⃣ Call Service

**New Service :** `call`

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

**Generate Domain** (Port 3005)

**Watch Paths:**
```
/apps/call-service/**
/packages/**
/Dockerfile.railway
```

---

### 5️⃣ Test Dashboard

**New Service :** `dashboard`

**Root Directory:**
```
apps/test-dashboard
```

**Variables:**
```env
PORT=3010
NODE_ENV=production
```

**Generate Domain** (Port 3010)

**Watch Paths:**
```
/apps/test-dashboard/**
```

---

## 🔗 URLs Finales

Une fois tout déployé, tu auras :

```
Auth:      https://front-production-9c45.up.railway.app
Numbers:   https://numbers-production-xxxx.up.railway.app
Messaging: https://messaging-production-xxxx.up.railway.app
Billing:   https://billing-production-xxxx.up.railway.app
Call:      https://call-production-xxxx.up.railway.app
Dashboard: https://dashboard-production-xxxx.up.railway.app
```

**Mets à jour le dashboard avec ces URLs !**

---

## ✅ Checklist de Déploiement

- [ ] Numbers Service créé
  - [ ] Root directory configuré
  - [ ] Variables d'environnement ajoutées
  - [ ] Domain généré
  - [ ] Watch paths configurés
  - [ ] Déployé avec succès

- [ ] Messaging Service créé
  - [ ] Root directory configuré
  - [ ] Variables d'environnement ajoutées
  - [ ] ENCRYPTION_KEY générée
  - [ ] Domain généré
  - [ ] Watch paths configurés
  - [ ] Déployé avec succès

- [ ] Billing Service créé
  - [ ] Root directory configuré
  - [ ] Variables d'environnement ajoutées
  - [ ] Stripe keys configurées
  - [ ] Price IDs configurés
  - [ ] Domain généré
  - [ ] Watch paths configurés
  - [ ] Déployé avec succès

- [ ] Call Service créé
  - [ ] Root directory configuré
  - [ ] Variables d'environnement ajoutées
  - [ ] Domain généré
  - [ ] Watch paths configurés
  - [ ] Déployé avec succès

- [ ] Test Dashboard créé
  - [ ] Root directory configuré
  - [ ] Variables d'environnement ajoutées
  - [ ] Domain généré
  - [ ] Watch paths configurés
  - [ ] Déployé avec succès

- [ ] Mettre à jour le Test Dashboard avec les vraies URLs
- [ ] Tester tous les endpoints depuis le dashboard

---

## 🛠️ Troubleshooting

**Si le build échoue :**
1. Vérifie que le `Root Directory` est correct
2. Vérifie que `Dockerfile.railway` existe à la racine
3. Vérifie les watch paths
4. Check les logs de build dans Railway

**Si le service crash au démarrage :**
1. Vérifie les variables d'environnement
2. Check que DATABASE_URL et REDIS_URL sont bien référencées
3. Vérifie les logs dans Railway → Deployments

**Si les migrations échouent :**
1. Assure-toi que Postgres est bien démarré
2. Vérifie le pre-deploy command dans railway.json
3. Run les migrations manuellement si besoin

---

## 📞 Support

Si tu bloques, envoie-moi :
- Le nom du service qui pose problème
- Les logs d'erreur de Railway
- Ta config actuelle

---

**Date :** 2026-02-24
**Version :** 1.0
