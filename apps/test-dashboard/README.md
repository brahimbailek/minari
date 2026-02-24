# CommPro Test Dashboard

Interface web pour tester et visualiser tous les endpoints des services backend CommPro.

## 🎯 Fonctionnalités

- **Test interactif** de tous les endpoints API
- **Visualisation** des réponses en temps réel
- **Monitoring** du statut de chaque service
- **Statistiques** des tests (réussis/échoués)
- **Configuration** des URLs de service
- **Authentification** avec JWT automatique

## 📊 Services Testés

1. **Auth Service** (Port 3001)
   - Register, Login, 2FA, Profile

2. **Numbers Service** (Port 3002)
   - Search, Purchase, List numbers

3. **Messaging Service** (Port 3003)
   - Send SMS, Conversations, Contacts

4. **Call Service** (Port 3005)
   - Initiate calls, List, Stats

5. **Billing Service** (Port 3004)
   - Subscribe, Usage, Invoices

## 🚀 Démarrage

```bash
cd apps/test-dashboard
npm install
npm start
```

Le dashboard sera accessible sur: **http://localhost:3010**

## 💡 Utilisation

1. **Démarrer tous les services backend** (ports 3001-3005)
2. **Ouvrir** http://localhost:3010
3. **Tester** un endpoint en cliquant sur "Test"
4. **Voir** la réponse dans le panneau qui s'affiche

### Login automatique

1. Cliquer sur "Test" pour `/api/auth/login`
2. Le JWT est automatiquement sauvegardé
3. Tous les endpoints protégés utilisent ce token

## 🎨 Interface

- **Cartes colorées** pour chaque service
- **Indicateurs** de statut en temps réel
- **Statistiques** en haut de page
- **Viewer JSON** pour les réponses
- **Configuration** des URLs personnalisables

## 📝 Notes

- Les endpoints utilisent des données de test par défaut
- Modifier les URLs si vos services sont sur d'autres ports
- Le token JWT est stocké en mémoire (perdu au refresh)

---

**Version:** 1.0.0
**Port:** 3010
