# 🚂 Déploiement Railway - Guide Complet

## 📋 Prérequis

1. **Compte Railway** (gratuit) : https://railway.app/
2. **Railway CLI installé** ✅ (déjà fait)
3. **Compte GitHub** (pour auto-deploy)

---

## 🚀 Étape 1: Se connecter à Railway

```bash
cd C:\Users\Brahim\Desktop\CommPro

# Se connecter à Railway (ouvre le navigateur)
railway login
```

**Suis les instructions dans le navigateur pour autoriser l'accès.**

---

## 🏗️ Étape 2: Créer le projet Railway

```bash
# Créer un nouveau projet
railway init

# Nom suggéré: commpro-production
```

**Ou depuis le dashboard Railway :**
1. Aller sur https://railway.app/dashboard
2. Cliquer "New Project"
3. Choisir "Empty Project"
4. Nom : "CommPro Production"

---

## 💾 Étape 3: Ajouter PostgreSQL

**Option A - Via CLI :**
```bash
railway add postgresql
```

**Option B - Via Dashboard :**
1. Dans ton projet Railway
2. Cliquer "+ New"
3. Sélectionner "Database" → "Add PostgreSQL"
4. Attendre le provisioning (~30 secondes)

**Récupérer l'URL de connexion :**
```bash
railway variables
```

Copie la valeur de `DATABASE_URL` (commence par `postgresql://...`)

---

## 🔴 Étape 4: Ajouter Redis

**Option A - Via CLI :**
```bash
railway add redis
```

**Option B - Via Dashboard :**
1. Dans ton projet Railway
2. Cliquer "+ New"
3. Sélectionner "Database" → "Add Redis"
4. Attendre le provisioning

**Récupérer l'URL de connexion :**
```bash
railway variables
```

Copie la valeur de `REDIS_URL`

---

## ⚙️ Étape 5: Configurer les variables d'environnement

### 5.1 Créer un service pour Auth Service

```bash
# Se placer dans le dossier auth-service
cd apps/auth-service

# Créer un nouveau service Railway
railway service create auth-service
```

### 5.2 Définir les variables d'environnement

**Via CLI (recommandé pour les secrets) :**

```bash
# JWT Secrets (utilise ceux générés dans .env local)
railway variables set JWT_SECRET=e99bb1e90a6b1aef36e13e29853659f7eed60ea6b50fd3352440fdcc5b57d545

railway variables set REFRESH_TOKEN_SECRET=d44473d8efe0203bfc1c2a3c7ba16a162959bc292677eff19623051159cd40b0

railway variables set INTERNAL_SERVICE_SECRET=6068467bdb83ad5399980907ee71c630d95856aa24aa2d42a6a6c652507123f6

# JWT Configuration
railway variables set JWT_EXPIRES_IN=15m
railway variables set REFRESH_TOKEN_EXPIRES_IN=7d

# Node Environment
railway variables set NODE_ENV=production
railway variables set LOG_LEVEL=info

# Port (Railway l'assigne automatiquement, mais on peut spécifier)
railway variables set PORT=3001
```

**Via Dashboard (plus visuel) :**
1. Aller dans ton projet → Service "auth-service"
2. Onglet "Variables"
3. Cliquer "+ New Variable"
4. Ajouter chaque variable :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | *(Auto-ajouté par Railway si PostgreSQL dans le même projet)* |
| `REDIS_URL` | *(Auto-ajouté par Railway si Redis dans le même projet)* |
| `JWT_SECRET` | `e99bb1e90a6b1aef36e13e29853659f7eed60ea6b50fd3352440fdcc5b57d545` |
| `REFRESH_TOKEN_SECRET` | `d44473d8efe0203bfc1c2a3c7ba16a162959bc292677eff19623051159cd40b0` |
| `INTERNAL_SERVICE_SECRET` | `6068467bdb83ad5399980907ee71c630d95856aa24aa2d42a6a6c652507123f6` |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `PORT` | `3001` |

**Variables Twilio/Stripe (à ajouter plus tard) :**
```bash
# Twilio (quand tu auras les clés)
railway variables set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
railway variables set TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx

# Stripe (quand tu auras les clés)
railway variables set STRIPE_SECRET_KEY=sk_test_xxxxxxxxx
```

---

## 📦 Étape 6: Préparer le déploiement

### 6.1 Créer un Dockerfile pour Auth Service

```bash
cd C:\Users\Brahim\Desktop\CommPro
```

Créer `apps/auth-service/Dockerfile` :

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages ./packages
COPY apps/auth-service ./apps/auth-service

# Install dependencies
RUN npm ci

# Build packages
RUN npm run build --filter=@commpro/database
RUN npm run build --filter=@commpro/shared
RUN npm run build --filter=@commpro/auth-service

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package.json ./apps/auth-service/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
WORKDIR /app/apps/auth-service
CMD ["node", "dist/index.js"]
```

### 6.2 Créer un .dockerignore

```bash
node_modules
dist
.git
.env
.env.local
*.log
.turbo
coverage
```

---

## 🚀 Étape 7: Déployer !

### Option A - Depuis GitHub (Recommandé pour auto-deploy)

1. **Push ton code sur GitHub :**

```bash
cd C:\Users\Brahim\Desktop\CommPro

# Initialiser Git remote (si pas déjà fait)
git remote add origin https://github.com/TON_USERNAME/commpro.git

# Push
git push -u origin main
```

2. **Connecter Railway à GitHub :**
   - Dans Railway Dashboard
   - Projet CommPro → Service auth-service
   - Onglet "Settings"
   - Section "Source" → "Connect to GitHub"
   - Sélectionner ton repo "commpro"
   - Branch : `main`
   - Root directory : `apps/auth-service`

3. **Auto-deploy activé !**
   - À chaque push sur `main`, Railway redéploie automatiquement

### Option B - Déploiement direct (Plus rapide pour tester)

```bash
cd C:\Users\Brahim\Desktop\CommPro

# Déployer directement
railway up
```

Railway va :
1. Détecter ton code
2. Builder l'image Docker
3. Déployer sur Railway
4. Assigner une URL publique

---

## 🗄️ Étape 8: Exécuter les migrations Prisma

Une fois déployé, tu dois créer les tables dans la base de données :

```bash
# Se connecter au service Railway
railway link

# Exécuter les migrations
railway run npm run db:migrate

# Ou avec Prisma directement
railway run npx prisma migrate deploy
```

**Ou depuis le dashboard :**
1. Projet → Service auth-service
2. Onglet "Deployments"
3. Dernière deploy → "View Logs"
4. Vérifier qu'il n'y a pas d'erreurs
5. Aller dans PostgreSQL service → "Data" → Query
6. Vérifier que les tables sont créées

---

## 🔍 Étape 9: Obtenir l'URL de production

```bash
# Obtenir l'URL publique
railway status

# Ou
railway domain
```

**Exemple d'URL :** `https://auth-service-production-xxxx.up.railway.app`

**Tester le health check :**
```bash
curl https://auth-service-production-xxxx.up.railway.app/health
```

Devrait retourner :
```json
{
  "status": "OK",
  "service": "auth-service",
  "timestamp": "...",
  "uptime": 123.45
}
```

---

## 🧪 Étape 10: Tester en production

### Test Register

```bash
curl -X POST https://TON_URL_RAILWAY/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Test Login

```bash
curl -X POST https://TON_URL_RAILWAY/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

---

## 💰 Coûts Railway (Estimation)

**Avec ton compte Railway existant :**

| Service | Plan | Coût |
|---------|------|------|
| PostgreSQL | Shared | €5/mois |
| Redis | Shared | €5/mois |
| Auth Service | Hobby | €5/mois |
| **Total Phase 1** | | **€15/mois** |

**À 100 users actifs :**
- PostgreSQL : €5/mois
- Redis : €5/mois
- Auth Service : €10/mois
- **Total : ~€20/mois**

**À 1000 users actifs :**
- PostgreSQL Dedicated : €20/mois
- Redis Dedicated : €20/mois
- Auth Service (scaled) : €30/mois
- **Total : ~€70/mois**

---

## 🔧 Commandes utiles Railway

```bash
# Voir les logs en temps réel
railway logs

# Liste des variables
railway variables

# Ouvrir le dashboard
railway open

# Connecter le projet local
railway link

# Exécuter une commande dans le contexte Railway
railway run <command>

# Lister les services
railway service

# Changer de service
railway service <service-name>
```

---

## 📊 Monitoring

**Dans le dashboard Railway :**
- **Metrics** : CPU, RAM, Network
- **Logs** : Logs en temps réel
- **Deployments** : Historique des déploiements
- **Health Checks** : Status du endpoint /health

**Alertes (optionnel) :**
1. Projet → Settings → Notifications
2. Ajouter email ou Slack webhook
3. Configurer alertes (downtime, errors, etc.)

---

## 🐛 Dépannage

### Erreur: "Build failed"
- Vérifier les logs dans Railway Dashboard
- S'assurer que toutes les dépendances sont dans package.json
- Vérifier le Dockerfile

### Erreur: "Database connection failed"
- Vérifier que `DATABASE_URL` est bien défini
- Vérifier que PostgreSQL est dans le même projet
- Railway auto-connecte les services du même projet

### Service ne répond pas
- Vérifier les logs : `railway logs`
- Vérifier le health check endpoint
- Vérifier que le port est bien exposé (3001)

### Migrations Prisma échouent
```bash
# Générer le client Prisma dans Railway
railway run npx prisma generate

# Puis les migrations
railway run npx prisma migrate deploy
```

---

## ✅ Checklist finale

- [ ] Railway CLI installé
- [ ] Connexion Railway active (`railway login`)
- [ ] Projet créé
- [ ] PostgreSQL ajouté
- [ ] Redis ajouté
- [ ] Variables d'environnement configurées
- [ ] Code déployé
- [ ] Migrations exécutées
- [ ] Health check fonctionne
- [ ] Endpoint Register testé
- [ ] Endpoint Login testé

---

**Une fois tout ça fait, ton Auth Service est en PRODUCTION ! 🎉**

Prochaine étape : Ajouter Numbers Service, Messaging Service, etc.
