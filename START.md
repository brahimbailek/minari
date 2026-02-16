# 🚀 Démarrage Rapide CommPro

## ✅ Ce qui est déjà fait

- ✅ Dépendances installées (323 packages)
- ✅ Auth Service complet (JWT, bcrypt, Zod)
- ✅ Fichier `.env` créé avec secrets sécurisés
- ✅ Structure complète du projet

## 🎯 Pour démarrer MAINTENANT

### Étape 1: Démarrer Docker Desktop (OBLIGATOIRE)

**Lance Docker Desktop sur ton PC :**
1. Ouvrir Docker Desktop
2. Attendre l'icône verte (Docker Running)
3. Vérifier dans la barre des tâches

### Étape 2: Démarrer l'infrastructure (2 minutes)

```bash
cd C:\Users\Brahim\Desktop\CommPro

# Démarrer PostgreSQL + Redis + Adminer
docker compose up -d

# Vérifier que les conteneurs fonctionnent
docker ps
```

**Tu devrais voir :**
- `commpro-postgres` - PostgreSQL sur port 5432
- `commpro-redis` - Redis sur port 6379
- `commpro-adminer` - Interface DB sur http://localhost:8080

### Étape 3: Configurer la base de données (1 minute)

```bash
# Générer le client Prisma
npm run db:generate

# Créer la base de données et appliquer les migrations
npm run db:migrate
```

### Étape 4: Démarrer l'Auth Service (30 secondes)

```bash
# Ouvrir un nouveau terminal
cd C:\Users\Brahim\Desktop\CommPro\apps\auth-service

# Démarrer en mode dev
npm run dev
```

**Le service démarre sur http://localhost:3001**

### Étape 5: Tester le Health Check (10 secondes)

Dans un autre terminal ou navigateur :

```bash
curl http://localhost:3001/health
```

**Devrait retourner :**
```json
{
  "status": "OK",
  "service": "auth-service",
  "timestamp": "2026-02-15T...",
  "uptime": 5.123
}
```

---

## 🧪 Tester les endpoints

### Test 1: Register (Créer un utilisateur)

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Résultat attendu :**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

**Copie le `accessToken` pour les prochains tests !**

### Test 2: Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Test 3: Me (Profil avec token)

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TON_ACCESS_TOKEN_ICI"
```

### Test 4: Refresh Token

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "TON_REFRESH_TOKEN_ICI"
  }'
```

### Test 5: Logout

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "TON_REFRESH_TOKEN_ICI"
  }'
```

---

## 🛠️ Outils Utiles

### Adminer (Interface base de données)
```
http://localhost:8080
```

**Connexion :**
- Système : PostgreSQL
- Serveur : postgres
- Utilisateur : postgres
- Mot de passe : postgres
- Base de données : commpro_dev

### Prisma Studio (Interface moderne)
```bash
npm run db:studio
```

Ouvre http://localhost:5555

---

## 🐛 Dépannage

### Erreur: "Cannot find module '@commpro/database'"

```bash
cd packages/database
npm run build
```

### Erreur: "Connection refused" (PostgreSQL)

```bash
# Vérifier que Docker tourne
docker ps

# Si rien, redémarrer Docker Compose
docker compose down
docker compose up -d
```

### Port déjà utilisé (3001, 5432, etc.)

```bash
# Trouver le processus qui utilise le port
netstat -ano | findstr :3001

# Tuer le processus (Windows)
taskkill /PID <process_id> /F
```

---

## 📊 État Actuel

✅ **Fonctionnel :**
- Register (POST /api/auth/register)
- Login (POST /api/auth/login)
- Refresh (POST /api/auth/refresh)
- Me (GET /api/auth/me)
- Logout (POST /api/auth/logout)
- Change Password (PUT /api/auth/change-password)
- Update Profile (PUT /api/auth/profile)

🟡 **Stubs (à implémenter) :**
- Forgot Password (email requis)
- Reset Password (token requis)
- 2FA Enable/Confirm/Disable/Verify (Phase 2)

---

## 🎯 Prochaines Étapes

1. ✅ Tester tous les endpoints Auth Service
2. ⏳ Créer Numbers Service (Twilio)
3. ⏳ Créer Messaging Service (SMS/MMS)
4. ⏳ Créer Call Service (Voice)
5. ⏳ Créer Billing Service (Stripe)

---

**Bon dev ! 🚀**
