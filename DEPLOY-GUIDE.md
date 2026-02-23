# Guide de Déploiement Railway - CommPro

Ce guide vous explique comment déployer CommPro sur Railway après les corrections de crash.

## 🔧 Corrections Appliquées

Les problèmes suivants ont été corrigés :

1. **Dockerfile** :
   - Ajout des dépendances build pour `bcrypt` (python3, make, g++)
   - Correction de la commande `npm run build` → `npx turbo run build`
   - Ajout d'une `DATABASE_URL` factice pour la génération Prisma au build
   - Copie complète des `node_modules` pour éviter les erreurs de runtime

2. **railway.json** :
   - Changement de `NIXPACKS` → `DOCKERFILE` pour utiliser notre Dockerfile optimisé
   - Configuration du `dockerfilePath`

3. **Dashboard de Suivi** :
   - Nouvelle route `/status` qui affiche un dashboard HTML en temps réel
   - API JSON disponible à `/status/api`
   - Auto-refresh toutes les 30 secondes
   - Monitoring de la progression Phase 1, endpoints, DB, mémoire

---

## 📋 Prérequis

- Compte Railway : https://railway.app
- GitHub repo public ou privé connecté
- Variables d'environnement prêtes (voir section suivante)

---

## 🔑 Variables d'Environnement Railway

Connectez-vous à Railway et configurez ces variables dans votre service :

### **Obligatoires**

```bash
# Node
NODE_ENV=production
PORT=3001

# Database (Railway PostgreSQL plugin fournit DATABASE_URL automatiquement)
DATABASE_URL=postgresql://...  # Fourni par Railway

# Redis (Railway Redis plugin fournit REDIS_URL automatiquement)
REDIS_URL=redis://...  # Fourni par Railway

# JWT (générez des secrets forts)
JWT_SECRET=votre_secret_jwt_min_32_caracteres_aleatoires
REFRESH_TOKEN_SECRET=votre_secret_refresh_min_32_caracteres_aleatoires
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Internal Service Auth
INTERNAL_SERVICE_SECRET=votre_secret_interne_services

# CORS
WEB_APP_URL=https://votre-frontend.vercel.app
```

### **Optionnelles (pour plus tard)**

```bash
# Twilio (Numbers, Calls, SMS)
TWILIO_ACCOUNT_SID=ACxxxx...
TWILIO_AUTH_TOKEN=xxxxx...

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_live_xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...

# Sentry (Monitoring)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 🚀 Déploiement Étape par Étape

### **1. Créer un Projet Railway**

```bash
# Via Railway Dashboard
1. Aller sur https://railway.app
2. Cliquer "New Project"
3. Sélectionner "Deploy from GitHub repo"
4. Autoriser Railway à accéder à votre repo GitHub
5. Sélectionner le repo "brahimbailek/minari"
```

### **2. Ajouter PostgreSQL**

```bash
1. Dans votre projet Railway, cliquer "+ New"
2. Sélectionner "Database" → "PostgreSQL"
3. Railway génère automatiquement DATABASE_URL
```

### **3. Ajouter Redis (optionnel pour Phase 1)**

```bash
1. Cliquer "+ New" → "Database" → "Redis"
2. Railway génère automatiquement REDIS_URL
```

### **4. Configurer le Service Auth**

```bash
1. Cliquer sur votre service (déployé depuis GitHub)
2. Onglet "Settings"
3. Root Directory: /
4. Build Command: (laisser vide, géré par Dockerfile)
5. Start Command: (laisser vide, géré par Dockerfile)
```

### **5. Ajouter les Variables d'Environnement**

```bash
1. Onglet "Variables"
2. Cliquer "New Variable"
3. Ajouter toutes les variables obligatoires (voir section précédente)
4. DATABASE_URL et REDIS_URL sont déjà présents (ajoutés par les plugins)
```

### **6. Générer un Domaine Public**

```bash
1. Onglet "Settings"
2. Section "Networking"
3. Cliquer "Generate Domain"
4. Vous obtenez une URL : https://votre-service.up.railway.app
```

### **7. Exécuter les Migrations Prisma**

Une fois le service déployé :

```bash
# Option 1 : Via Railway CLI (recommandé)
railway login
railway link
railway run npx prisma migrate deploy

# Option 2 : Via le dashboard Railway (Service → Settings → Deploy Triggers)
# Ajouter un "One-off command" : npx prisma migrate deploy
```

---

## ✅ Vérification du Déploiement

### **1. Health Check**

```bash
curl https://votre-service.up.railway.app/health
```

**Réponse attendue :**
```json
{
  "status": "OK",
  "service": "auth-service",
  "timestamp": "2026-02-23T...",
  "uptime": 123.45
}
```

### **2. Dashboard de Suivi** ⭐

Ouvrez dans votre navigateur :
```
https://votre-service.up.railway.app/status
```

Vous verrez :
- ✅ Statut du serveur (uptime, mémoire)
- ✅ Connexion à la base de données
- ✅ Nombre d'utilisateurs
- ✅ Progression Phase 1 (%)
- ✅ Liste des services (Auth ✓, Numbers ⏳, Messaging ⏳, etc.)
- ✅ Endpoints API disponibles
- 🔄 Auto-refresh toutes les 30 secondes

### **3. API JSON du Dashboard**

```bash
curl https://votre-service.up.railway.app/status/api
```

Retourne toutes les données en JSON.

### **4. Test d'Inscription**

```bash
curl -X POST https://votre-service.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

## 📊 Monitoring en Production

### **Logs en Temps Réel**

```bash
# Via Railway CLI
railway logs

# Via Dashboard
Service → Deployments → Cliquer sur le déploiement actif → View Logs
```

### **Métriques**

Le dashboard `/status` vous donne :
- Uptime du serveur
- Latence base de données
- Mémoire utilisée (RSS, Heap)
- Nombre d'utilisateurs inscrits
- Statut de chaque endpoint

### **Alertes**

Si le dashboard n'est pas accessible :
1. Vérifier les logs Railway
2. Vérifier que `DATABASE_URL` est correcte
3. Vérifier les migrations Prisma

---

## 🐛 Troubleshooting

### **Erreur : "Prisma Client not generated"**

```bash
# Rebuild forcé
railway up --detach
railway run npx prisma generate
railway restart
```

### **Erreur : "bcrypt binding not found"**

✅ **Déjà corrigé** dans le nouveau Dockerfile (dépendances natives installées)

### **Erreur : "DATABASE_URL not found"**

Vérifiez que :
1. Le plugin PostgreSQL est ajouté
2. `DATABASE_URL` est dans les variables d'environnement
3. Le service a redémarré après l'ajout

### **Erreur : "Port already in use"**

Railway définit automatiquement `PORT`. Ne le forcez pas dans le code.

### **Le dashboard affiche "DB: Error"**

1. Vérifier `DATABASE_URL` dans les variables
2. Vérifier que les migrations ont été exécutées :
   ```bash
   railway run npx prisma migrate deploy
   ```
3. Tester la connexion manuellement :
   ```bash
   railway run npx prisma db execute --stdin <<< "SELECT 1"
   ```

---

## 🔄 Redéploiement après Modifications

### **Déploiement Automatique (GitHub)**

Railway redéploie automatiquement à chaque push sur la branche `main`.

### **Déploiement Manuel**

```bash
railway up
```

### **Redémarrage sans Rebuild**

```bash
railway restart
```

---

## 📈 Prochaines Étapes

Une fois l'Auth Service stable :

1. **Numbers Service** → Twilio virtual numbers
2. **Messaging Service** → SMS/MMS encryption
3. **Billing Service** → Stripe subscriptions
4. **Call Service** → Twilio Voice API
5. **Mobile Apps** → iOS + Android

Suivez la progression sur `/status` !

---

## 🆘 Support

- **Logs Railway** : `railway logs`
- **Status Dashboard** : `https://votre-url.railway.app/status`
- **Railway Docs** : https://docs.railway.app

---

## 📝 Checklist de Déploiement

- [ ] Compte Railway créé
- [ ] Repo GitHub connecté
- [ ] PostgreSQL plugin ajouté
- [ ] Redis plugin ajouté (optionnel Phase 1)
- [ ] Variables d'environnement configurées
- [ ] Service déployé avec succès
- [ ] Migrations Prisma exécutées
- [ ] Health check `/health` retourne 200 OK
- [ ] Dashboard `/status` accessible
- [ ] Test d'inscription réussi
- [ ] Domaine public généré
- [ ] Logs surveillés

---

**Version** : 1.0.0
**Dernière mise à jour** : 23 février 2026
**Auteur** : CommPro Team + Claude Sonnet 4.5
