#!/bin/bash

# CommPro - Script de déploiement Railway
# Usage: ./deploy-railway.sh

echo "🚂 Déploiement CommPro sur Railway"
echo "===================================="
echo ""

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo "Installation: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI détecté"
echo ""

# Se connecter à Railway
echo "📝 Connexion à Railway..."
railway login

if [ $? -ne 0 ]; then
    echo "❌ Échec de connexion à Railway"
    exit 1
fi

echo "✅ Connecté à Railway"
echo ""

# Créer ou lier le projet
echo "🏗️  Configuration du projet..."
railway link

echo ""
echo "📦 Ajout des services..."

# Ajouter PostgreSQL
echo "  - PostgreSQL..."
railway add -d postgresql

# Ajouter Redis
echo "  - Redis..."
railway add -d redis

echo ""
echo "⚙️  Configuration des variables d'environnement..."

# Variables JWT (depuis .env local)
JWT_SECRET=$(grep JWT_SECRET .env | cut -d '=' -f2)
REFRESH_SECRET=$(grep REFRESH_TOKEN_SECRET .env | cut -d '=' -f2)
INTERNAL_SECRET=$(grep INTERNAL_SERVICE_SECRET .env | cut -d '=' -f2)

railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set REFRESH_TOKEN_SECRET="$REFRESH_SECRET"
railway variables set INTERNAL_SERVICE_SECRET="$INTERNAL_SECRET"
railway variables set JWT_EXPIRES_IN="15m"
railway variables set REFRESH_TOKEN_EXPIRES_IN="7d"
railway variables set NODE_ENV="production"
railway variables set LOG_LEVEL="info"

echo "✅ Variables configurées"
echo ""

# Déployer
echo "🚀 Déploiement en cours..."
cd apps/auth-service
railway up

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Déploiement réussi!"
    echo ""
    echo "📊 Informations:"
    railway status
    echo ""
    echo "🌐 URL de l'application:"
    railway domain
    echo ""
    echo "📝 Prochaines étapes:"
    echo "  1. Exécuter les migrations: railway run npx prisma migrate deploy"
    echo "  2. Tester le health check: curl https://YOUR_URL/health"
    echo "  3. Tester le register: curl -X POST https://YOUR_URL/api/auth/register ..."
else
    echo "❌ Échec du déploiement"
    echo "Vérifiez les logs: railway logs"
    exit 1
fi
