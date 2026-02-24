# Billing Service - Plan d'Implémentation

> **Service :** Port 3004
> **Durée estimée :** 3-4h
> **Complexité :** Moyenne (Stripe integration, Webhooks)

---

## 📋 Vue d'Ensemble

Le Billing Service gère les abonnements, paiements et facturation via Stripe.

### Fonctionnalités Principales

1. 💳 **Subscriptions** (4 tiers)
2. 📊 **Usage Tracking** (SMS, appels, minutes)
3. 🧾 **Invoices** (génération et historique)
4. 💰 **Payment Methods** (cartes, gestion)
5. 🔔 **Webhooks Stripe** (events)
6. 📈 **Pricing** (calcul coûts)

---

## 💎 Tiers de Subscription

### **Starter** - 9€/mois
- 1 numéro virtuel
- 500 SMS/mois
- 100 minutes d'appels/mois
- Support email

### **Pro** - 29€/mois
- 3 numéros virtuels
- 2000 SMS/mois
- 500 minutes d'appels/mois
- Support prioritaire
- Historique 12 mois

### **Business** - 79€/mois
- 10 numéros virtuels
- 10000 SMS/mois
- 2000 minutes d'appels/mois
- Support 24/7
- Historique illimité
- API access

### **Enterprise** - Sur mesure
- Numéros illimités
- SMS/Appels illimités
- Support dédié
- SLA 99.9%
- Custom features

---

## 🎯 Étapes d'Implémentation

### ✅ Étape 1 : Structure du Service (15min)
- [x] Créer `apps/billing-service/`
- [x] Configurer `package.json` avec dépendances
- [x] Créer middleware et structure de base

**Fichiers créés :**
- `src/index.ts`
- `src/controllers/billingController.ts`
- `src/routes/billingRoutes.ts`
- `src/services/stripeService.ts`
- `src/utils/validation.ts`
- `src/utils/pricing.ts`

---

### ⏳ Étape 2 : Configuration Stripe (30min)
- [ ] Configurer Stripe SDK
- [ ] Créer les 4 produits + prix dans Stripe
- [ ] Configurer webhooks Stripe
- [ ] Tester création de customer

**Stripe Products :**
```javascript
{
  starter: { price: 900, // 9€ en centimes
  pro: { price: 2900,     // 29€
  business: { price: 7900, // 79€
  enterprise: { price: null // Custom
}
```

---

### ⏳ Étape 3 : Subscriptions (1h)
- [ ] `POST /api/billing/subscribe` - S'abonner à un tier
- [ ] `GET /api/billing/subscription` - Détails subscription
- [ ] `PUT /api/billing/subscription` - Changer de tier
- [ ] `DELETE /api/billing/subscription` - Annuler
- [ ] Gestion trial period (14 jours)

**Flux de souscription :**
```
1. User POST /api/billing/subscribe { tier: 'pro' }
2. Créer Stripe Customer (si n'existe pas)
3. Créer Subscription avec Price ID
4. Sauvegarder en DB
5. Retourner { subscriptionId, status, currentPeriodEnd }
```

---

### ⏳ Étape 4 : Payment Methods (45min)
- [ ] `POST /api/billing/payment-methods` - Ajouter carte
- [ ] `GET /api/billing/payment-methods` - Liste cartes
- [ ] `PUT /api/billing/payment-methods/:id/default` - Carte par défaut
- [ ] `DELETE /api/billing/payment-methods/:id` - Supprimer

**Flow Stripe :**
```
1. Frontend crée PaymentMethod avec Stripe.js
2. POST payment-method ID to backend
3. Backend attache à Customer
4. Sauvegarde en DB
```

---

### ⏳ Étape 5 : Usage Tracking (45min)
- [ ] `POST /api/billing/usage` - Enregistrer usage (interne)
- [ ] `GET /api/billing/usage` - Consulter usage du mois
- [ ] Auto-increment sur SMS/Appels
- [ ] Alertes si dépassement quota

**Tracking :**
```javascript
{
  smsCount: 450 / 500,
  callMinutes: 75 / 100,
  numbersCount: 1 / 1,
  overage: { sms: 0, minutes: 0 }
}
```

---

### ⏳ Étape 6 : Invoices (30min)
- [ ] `GET /api/billing/invoices` - Liste factures
- [ ] `GET /api/billing/invoices/:id` - Détails facture
- [ ] `GET /api/billing/invoices/:id/pdf` - Télécharger PDF
- [ ] Auto-génération par Stripe

---

### ⏳ Étape 7 : Webhooks Stripe (45min)
- [ ] `POST /webhook/stripe` - Webhook events
- [ ] Gérer : invoice.paid, invoice.payment_failed
- [ ] Gérer : customer.subscription.updated
- [ ] Gérer : customer.subscription.deleted
- [ ] Validation signature

---

### ⏳ Étape 8 : Dashboard & Déploiement (20min)
- [ ] Mettre à jour statusRoutes
- [ ] Ajouter 6 endpoints Billing
- [ ] Build et tester
- [ ] Commit et push

---

## 📊 Endpoints API (6 nouveaux)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/billing/subscribe` | S'abonner à un tier | 🔒 JWT |
| GET | `/api/billing/subscription` | Détails subscription | 🔒 JWT |
| PUT | `/api/billing/subscription` | Changer de tier | 🔒 JWT |
| DELETE | `/api/billing/subscription` | Annuler subscription | 🔒 JWT |
| GET | `/api/billing/invoices` | Liste factures | 🔒 JWT |
| POST | `/webhook/stripe` | Webhook Stripe events | Public |

---

## 🔐 Sécurité

### Webhooks
- Valider signature Stripe (`stripe-signature` header)
- Rejeter si signature invalide
- Logs de tous les événements

### Données sensibles
- Ne JAMAIS stocker les numéros de carte
- Stripe gère tout le paiement (PCI compliance)
- Token payment method uniquement

---

## 💰 Pricing & Overage

### Prix de base
- Starter: 9€/mois
- Pro: 29€/mois
- Business: 79€/mois

### Overage (dépassement)
- SMS supplémentaire: 0.05€
- Minute supplémentaire: 0.15€
- Numéro supplémentaire: 3€/mois

---

## 📦 Dépendances

```json
{
  "stripe": "^14.0.0",
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "zod": "^3.22.4",
  "dotenv": "^16.3.1"
}
```

---

## 🧪 Tests

### Test de souscription
```bash
curl -X POST http://localhost:3004/api/billing/subscribe \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro"}'
```

### Test webhook Stripe CLI
```bash
stripe listen --forward-to localhost:3004/webhook/stripe
stripe trigger payment_intent.succeeded
```

---

## 🚀 Déploiement Railway

### Variables d'environnement
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product IDs (created in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

### Configuration Stripe
1. Créer les 4 produits dans Stripe Dashboard
2. Configurer webhook endpoint :
   - URL: `https://your-app.railway.app/webhook/stripe`
   - Events: `invoice.*`, `customer.subscription.*`

---

## 📈 Progression Phase 1 Attendue

**Après Billing Service :**
- Auth Service : 100%
- 2FA TOTP : 100%
- Numbers Service : 100%
- Messaging Service : 100%
- Call Service : 100%
- **Billing Service : 100%** ✨
- Mobile iOS : 0%
- Mobile Android : 0%

**Total : 75% (6/8 features) - Backend 100% complet !**

---

**Dernière mise à jour :** 2026-02-24
**Status :** 🚧 En cours
