# Railway Build Troubleshooting - CommPro

## 🐛 Erreur Actuelle

```
ERROR: "/app/apps/auth-service/node_modules": not found
```

Cette erreur indique que Railway utilise un **cache de build obsolète** qui référence l'ancien Dockerfile (avant commit `b64c6f4`).

---

## ✅ Corrections Appliquées

| Commit | Changement |
|--------|------------|
| `b64c6f4` | Suppression de la ligne `COPY node_modules` invalide |
| `8de0c39` | Fix du `dockerfilePath` dans `railway.json` + ajout `railway.toml` |

Le Dockerfile actuel est **correct** et ne contient plus la ligne problématique.

---

## 🔧 Solutions

### **Option 1 : Forcer un Rebuild Clean (Recommandé)**

Via le **Railway Dashboard** :

```
1. Aller dans votre projet Railway
2. Cliquer sur le service (auth-service)
3. Onglet "Settings"
4. Section "Service Settings"
5. Cliquer "Delete" ou "Redeploy"
6. Ou bien : Onglet "Deployments"
7. Cliquer sur "..." (trois points) du dernier déploiement
8. Sélectionner "Redeploy" avec option "Clear Build Cache"
```

### **Option 2 : Via Railway CLI**

```bash
# Installer Railway CLI si ce n'est pas déjà fait
npm install -g @railway/cli

# Login
railway login

# Lier le projet
railway link

# Forcer un redéploiement
railway up --detach

# Ou redémarrer le service
railway restart
```

### **Option 3 : Commit à vide pour trigger**

Si les options précédentes ne marchent pas :

```bash
cd ~/UsersBrahimminari
git commit --allow-empty -m "chore: trigger Railway rebuild"
git push origin main
```

### **Option 4 : Supprimer et Recréer le Service**

En dernier recours :

```
1. Railway Dashboard → Votre projet
2. Cliquer sur le service auth-service
3. Settings → Danger Zone → "Remove Service from Project"
4. Créer un nouveau service :
   - "+ New" → "GitHub Repo" → brahimbailek/minari
   - Railway détectera railway.toml à la racine
5. Ajouter les variables d'environnement
6. Le build devrait réussir
```

---

## 📋 Vérification du Dockerfile Actuel

Le Dockerfile dans `main` (commit `8de0c39`) ne contient **plus** la ligne problématique :

```dockerfile
# ✅ CORRECT (version actuelle)
# Copy all node_modules (includes Prisma Client and all workspace dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copy built code
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package.json ./apps/auth-service/package.json

# ❌ LIGNE SUPPRIMÉE (n'existe plus)
# COPY --from=builder /app/apps/auth-service/node_modules ./apps/auth-service/node_modules
```

Vous pouvez vérifier sur GitHub :
https://github.com/brahimbailek/minari/blob/main/Dockerfile

---

## 🔍 Diagnostiquer le Problème

### **Vérifier le commit utilisé par Railway**

```
1. Railway Dashboard → Service → Deployments
2. Regarder le dernier déploiement actif
3. Vérifier le "Commit SHA"
4. Doit être : 8de0c39 ou plus récent
5. Si c'est un ancien commit (0737f56 ou b64c6f4), Railway utilise le cache
```

### **Vérifier les logs de build**

```
1. Deployments → Cliquer sur le déploiement en cours
2. Onglet "Build Logs"
3. Chercher la ligne :
   COPY --from=builder /app/apps/auth-service/node_modules
4. Si cette ligne apparaît → Railway utilise un ancien Dockerfile caché
```

---

## 🎯 Après le Rebuild

Une fois le build réussi, vérifiez :

### **1. Health Check**
```bash
curl https://votre-url.railway.app/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "service": "auth-service",
  "timestamp": "2026-02-23T...",
  "uptime": 123.45
}
```

### **2. Dashboard Status**
```
https://votre-url.railway.app/status
```

Devrait afficher :
- ✅ Serveur : En ligne
- ✅ Base de données : Connectée (si PostgreSQL configuré)
- 📊 Progression Phase 1 : 12%
- 📋 8 Services/Features
- 🔗 13 Endpoints API

### **3. Logs en temps réel**
```bash
railway logs
```

Devrait afficher :
```
🚀 Auth Service running on port 3001
📍 Environment: production
🏥 Health check: http://localhost:3001/health
```

---

## 💡 Pourquoi Ce Problème ?

Railway utilise **Docker BuildKit** avec cache de layers. Quand vous modifiez le Dockerfile :

1. ❌ **Ancien commit** (`0737f56`) → Dockerfile avec ligne invalide
2. ✅ **Commit fix** (`b64c6f4`) → Ligne supprimée
3. 🔄 **Railway** → Continue d'utiliser le cache de l'ancien build

**Solution** : Forcer un rebuild clean sans cache (voir Option 1 ci-dessus).

---

## 📞 Support

Si le problème persiste après ces solutions :

1. **Vérifier le commit** : Railway utilise-t-il `8de0c39` ou plus récent ?
2. **Vérifier le fichier** : https://github.com/brahimbailek/minari/blob/main/Dockerfile
3. **Build local** : `docker build -t test .` (si Docker Desktop est démarré)
4. **Railway Docs** : https://docs.railway.app/deploy/builds

---

## ✅ Checklist

- [ ] Commit `8de0c39` poussé sur `main`
- [ ] Railway détecte le nouveau commit
- [ ] Build cache vidé (Option 1, 2, 3, ou 4)
- [ ] Build réussi (pas d'erreur node_modules)
- [ ] `/health` retourne 200 OK
- [ ] `/status` affiche le dashboard
- [ ] Logs Railway montrent "Auth Service running"

---

**Dernière mise à jour** : 23 février 2026
**Commit actuel** : `8de0c39`
**Status** : Dockerfile corrigé, Railway doit rebuild sans cache
