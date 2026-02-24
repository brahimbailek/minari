# Messaging Service - Plan d'Implémentation

> **Service :** Port 3003
> **Durée estimée :** 6-8h
> **Complexité :** Élevée (E2E encryption, Real-time, Media handling)

---

## 📋 Vue d'Ensemble

Le Messaging Service gère l'envoi/réception de SMS/MMS via Twilio avec chiffrement end-to-end.

### Fonctionnalités Principales

1. 📨 **Envoi de SMS/MMS** (Twilio API)
2. 📥 **Réception de SMS/MMS** (Webhook Twilio)
3. 🔐 **Chiffrement E2E** (AES-256-GCM)
4. 💬 **Conversations** (groupement par contact)
5. 📎 **Médias** (images MMS)
6. 📖 **Statut de lecture** (read/unread)

---

## 🎯 Étapes d'Implémentation

### ✅ Étape 1 : Structure du Service (30min)
- [x] Créer `apps/messaging-service/`
- [x] Configurer `package.json` avec dépendances :
  - `twilio` (SMS/MMS)
  - `crypto` (chiffrement built-in Node.js)
  - `express`, `cors`, `helmet`
- [x] Créer middleware (auth, error, logger)
- [x] Structure de base (controllers, routes, services, utils)

**Fichiers créés :**
- `src/index.ts`
- `src/middleware/` (authMiddleware, errorHandler, requestLogger)
- `src/controllers/messagesController.ts`
- `src/routes/messagesRoutes.ts`
- `src/services/twilioMessagingService.ts`
- `src/services/encryptionService.ts`
- `src/utils/validation.ts`

---

### ⏳ Étape 2 : Configuration Twilio (30min)
- [ ] Configurer Twilio Messaging client
- [ ] Créer service d'envoi SMS/MMS
- [ ] Configurer webhook pour réception
- [ ] Tester envoi/réception basique

**Endpoints webhook :**
- `POST /webhook/sms` (réception SMS)
- `POST /webhook/status` (statut de livraison)

---

### ⏳ Étape 3 : Chiffrement E2E (1h)
- [ ] Implémenter `encryptionService.ts`
- [ ] Générer clés de chiffrement par utilisateur
- [ ] Fonction `encrypt(message)` → AES-256-GCM
- [ ] Fonction `decrypt(encryptedMessage)` → texte clair
- [ ] Stocker clés en DB (table `EncryptionKeys`)

**Schéma de chiffrement :**
```
Message clair → AES-256-GCM → Message chiffré (stocké en DB)
                    ↓
               Clé utilisateur (stockée séparément)
```

---

### ⏳ Étape 4 : Envoi de Messages (1h30)
- [ ] `POST /api/messages/send` - Envoyer SMS
- [ ] `POST /api/messages/send-mms` - Envoyer MMS avec média
- [ ] Validation du numéro émetteur (appartient à l'user)
- [ ] Chiffrement du message avant stockage
- [ ] Envoi via Twilio
- [ ] Sauvegarde en DB avec statut QUEUED

**Flux d'envoi :**
```
1. User POST /api/messages/send { from, to, body }
2. Valider que 'from' appartient à l'user
3. Chiffrer le 'body'
4. Envoyer via Twilio
5. Sauvegarder en DB (Message model)
6. Retourner { messageId, status: 'sent' }
```

---

### ⏳ Étape 5 : Réception de Messages (1h30)
- [ ] `POST /webhook/sms` - Webhook Twilio
- [ ] Parser les données Twilio (From, To, Body, MediaUrl)
- [ ] Trouver l'utilisateur destinataire
- [ ] Chiffrer le message reçu
- [ ] Sauvegarder en DB avec direction INBOUND
- [ ] Retourner TwiML vide (200 OK)

**Flux de réception :**
```
1. Twilio POST /webhook/sms { From, To, Body, MediaUrl[] }
2. Trouver PhoneNumber.user où phoneNumber = To
3. Créer contact si n'existe pas
4. Chiffrer le Body
5. Sauvegarder Message (direction: INBOUND)
6. Retourner 200 OK
```

---

### ⏳ Étape 6 : Conversations (1h)
- [ ] `GET /api/messages/conversations` - Liste conversations
- [ ] `GET /api/messages/conversations/:contactId` - Messages d'une conversation
- [ ] `PUT /api/messages/:id/read` - Marquer comme lu
- [ ] Groupement par `conversationId` ou `contactId`
- [ ] Trier par date (plus récent en premier)

**Endpoints :**
```
GET /api/messages/conversations
→ Retourne liste contacts avec dernier message + unread count

GET /api/messages/conversations/:contactId
→ Retourne tous messages avec ce contact (décryptés)

PUT /api/messages/:id/read
→ Marque message comme lu (readAt = now())
```

---

### ⏳ Étape 7 : Gestion des Médias (1h)
- [ ] Upload d'images pour MMS
- [ ] Validation (type, taille max 5MB)
- [ ] Stockage URL media en DB
- [ ] Récupération des médias Twilio (webhook)
- [ ] Affichage dans conversations

**Format MMS :**
```json
{
  "from": "+33123456789",
  "to": "+33987654321",
  "body": "Voici une photo !",
  "mediaUrls": ["https://api.twilio.com/media/ME..."]
}
```

---

### ⏳ Étape 8 : Dashboard & Déploiement (30min)
- [ ] Mettre à jour `statusRoutes.ts`
- [ ] Ajouter 6 endpoints Messaging
- [ ] Changer status Messaging Service → 100%
- [ ] Build et tester
- [ ] Commit et push

---

## 📊 Endpoints API (6 nouveaux)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/messages/send` | Envoyer SMS | 🔒 JWT |
| POST | `/api/messages/send-mms` | Envoyer MMS | 🔒 JWT |
| GET | `/api/messages/conversations` | Liste conversations | 🔒 JWT |
| GET | `/api/messages/conversations/:contactId` | Messages d'une conversation | 🔒 JWT |
| PUT | `/api/messages/:id/read` | Marquer comme lu | 🔒 JWT |
| POST | `/webhook/sms` | Webhook Twilio (réception) | Public |

---

## 🔐 Sécurité

### Chiffrement E2E
- **Algorithme :** AES-256-GCM
- **Clé :** Unique par utilisateur (256 bits)
- **IV :** Nouveau vecteur d'initialisation par message
- **Stockage :** Clé dans table séparée, message chiffré en DB

### Validation
- Vérifier que l'émetteur (`from`) appartient à l'utilisateur
- Valider format numéros (E.164)
- Rate limiting sur webhooks

---

## 📦 Dépendances

```json
{
  "twilio": "^5.0.0",
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "zod": "^3.22.4",
  "dotenv": "^16.3.1"
}
```

**Note :** `crypto` est built-in Node.js (pas besoin d'installer)

---

## 🧪 Tests Recommandés

### Tests d'Envoi
```bash
curl -X POST http://localhost:3003/api/messages/send \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+33123456789",
    "to": "+33987654321",
    "body": "Hello from CommPro!"
  }'
```

### Test de Réception (ngrok requis)
```bash
# 1. Démarrer service
npm run dev

# 2. Exposer avec ngrok
ngrok http 3003

# 3. Configurer webhook Twilio
# SMS Webhook URL: https://xxx.ngrok.io/webhook/sms

# 4. Envoyer SMS au numéro Twilio
# Le webhook devrait recevoir le message
```

---

## 🚀 Déploiement Railway

### Variables d'environnement à ajouter
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_SMS_WEBHOOK_URL=https://your-app.railway.app/webhook/sms
TWILIO_STATUS_CALLBACK_URL=https://your-app.railway.app/webhook/status
```

### Configuration webhook Twilio
Après déploiement, configurer dans Twilio Console :
1. Aller dans Phone Numbers → Active Numbers
2. Pour chaque numéro, configurer :
   - **SMS Webhook:** `POST https://your-app.railway.app/webhook/sms`
   - **Status Callback:** `POST https://your-app.railway.app/webhook/status`

---

## ✅ Checklist Finale

- [ ] Envoi SMS fonctionne
- [ ] Envoi MMS fonctionne
- [ ] Réception SMS via webhook fonctionne
- [ ] Messages chiffrés en DB
- [ ] Conversations groupées par contact
- [ ] Statut de lecture (read/unread)
- [ ] Médias MMS stockés et affichés
- [ ] Tests end-to-end passés
- [ ] Dashboard mis à jour (Messaging 100%)
- [ ] Déployé sur Railway

---

## 📈 Progression Phase 1 Attendue

**Après Messaging Service :**
- Auth Service : 100%
- 2FA TOTP : 100%
- Numbers Service : 100%
- **Messaging Service : 100%** ✨
- Billing Service : 0%
- Call Service : 0%
- Mobile iOS : 0%
- Mobile Android : 0%

**Total : 50% (4/8 features)**

---

**Dernière mise à jour :** 2026-02-24
**Status :** 🚧 En cours
