# Call Service - Plan d'Implémentation

> **Service :** Port 3005
> **Durée estimée :** 4-5h
> **Complexité :** Moyenne-Élevée (TwiML, Webhooks, Real-time)

---

## 📋 Vue d'Ensemble

Le Call Service gère les appels vocaux HD via Twilio Voice API avec support pour CallKit (iOS) et Telecom Framework (Android).

### Fonctionnalités Principales

1. 📞 **Initiation d'appels** (Outbound calls)
2. 📲 **Réception d'appels** (Inbound calls via webhook)
3. 📋 **Historique des appels** (Call logs)
4. 📊 **Monitoring qualité** (Call quality metrics)
5. 🔔 **Webhooks TwiML** (Call flow control)
6. ⏱️ **Durée et coût** (Call duration & pricing)

---

## 🎯 Étapes d'Implémentation

### ✅ Étape 1 : Structure du Service (20min)
- [x] Créer `apps/call-service/`
- [x] Configurer `package.json` avec dépendances :
  - `twilio` (Voice API)
  - `express`, `cors`, `helmet`
- [x] Créer middleware (auth, error, logger)
- [x] Structure de base

**Fichiers créés :**
- `src/index.ts`
- `src/middleware/` (authMiddleware, errorHandler, requestLogger)
- `src/controllers/callsController.ts`
- `src/routes/callsRoutes.ts`
- `src/services/twilioVoiceService.ts`
- `src/utils/validation.ts`
- `src/utils/twiml.ts` (TwiML generators)

---

### ⏳ Étape 2 : Configuration Twilio Voice (30min)
- [ ] Configurer Twilio Voice client
- [ ] Créer TwiML generators (answer, dial, hangup, record)
- [ ] Configurer webhooks pour call events
- [ ] Tester appel basique

**Webhooks TwiML :**
- `POST /webhook/voice` (incoming call)
- `POST /webhook/voice/status` (call status updates)
- `POST /webhook/voice/recording` (recording completed)

---

### ⏳ Étape 3 : Initiation d'Appels (1h)
- [ ] `POST /api/calls/initiate` - Démarrer un appel
- [ ] Validation du numéro émetteur
- [ ] Création de l'appel Twilio
- [ ] Sauvegarde en DB avec statut INITIATED
- [ ] Gestion des erreurs (numéro invalide, insufficient funds)

**Flux d'initiation :**
```
1. User POST /api/calls/initiate { from, to }
2. Valider que 'from' appartient à l'user
3. Créer appel via Twilio (client.calls.create)
4. Sauvegarder en DB (Call model)
5. Retourner { callId, status: 'initiated', sid }
```

---

### ⏳ Étape 4 : Réception d'Appels (1h)
- [ ] `POST /webhook/voice` - Webhook appel entrant
- [ ] Générer TwiML pour répondre
- [ ] Options : forward to user, voicemail, reject
- [ ] Sauvegarde en DB avec direction INBOUND
- [ ] Notification push (pour mobile apps)

**Flux de réception :**
```
1. Twilio POST /webhook/voice { From, To, CallSid }
2. Trouver PhoneNumber.user où phoneNumber = To
3. Générer TwiML : <Dial><Number>USER_DEVICE</Number></Dial>
4. Sauvegarder Call (direction: INBOUND)
5. Envoyer push notification (CallKit/Telecom)
6. Retourner TwiML response
```

---

### ⏳ Étape 5 : Historique & Status (45min)
- [ ] `GET /api/calls` - Liste des appels
- [ ] `GET /api/calls/:id` - Détails d'un appel
- [ ] `POST /webhook/voice/status` - Mises à jour status
- [ ] Update DB : RINGING → IN_PROGRESS → COMPLETED
- [ ] Calculer durée et coût

**Endpoints :**
```
GET /api/calls?limit=50&offset=0
→ Liste appels (filters: direction, status, date)

GET /api/calls/:id
→ Détails appel + enregistrement si disponible

POST /webhook/voice/status
→ Webhook Twilio pour updates (CallStatus, Duration, Price)
```

---

### ⏳ Étape 6 : Monitoring Qualité (30min)
- [ ] Récupérer metrics Twilio (jitter, latency, packet loss)
- [ ] Endpoint `GET /api/calls/:id/quality`
- [ ] Sauvegarde metrics en DB (CallQuality model)
- [ ] Alertes si qualité dégradée

**Metrics collectées :**
```json
{
  "jitter": 12.5,
  "latency": 45,
  "packetLoss": 0.2,
  "mos": 4.2,
  "codec": "opus"
}
```

---

### ⏳ Étape 7 : Dashboard & Déploiement (20min)
- [ ] Mettre à jour `statusRoutes.ts`
- [ ] Ajouter 5 endpoints Call Service
- [ ] Changer status Call Service → 100%
- [ ] Build et tester
- [ ] Commit et push

---

## 📊 Endpoints API (5 nouveaux)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/calls/initiate` | Démarrer un appel | 🔒 JWT |
| GET | `/api/calls` | Liste historique appels | 🔒 JWT |
| GET | `/api/calls/:id` | Détails d'un appel | 🔒 JWT |
| GET | `/api/calls/:id/quality` | Métriques qualité | 🔒 JWT |
| POST | `/webhook/voice` | Webhook appel entrant (TwiML) | Public |

---

## 🎙️ TwiML (Twilio Markup Language)

### Exemple : Appel sortant
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+33123456789">
    <Number>+33987654321</Number>
  </Dial>
</Response>
```

### Exemple : Appel entrant (forward)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">
    Vous avez un appel entrant. Connexion en cours.
  </Say>
  <Dial timeout="30" action="/webhook/voice/completed">
    <Number>+33USER_DEVICE</Number>
  </Dial>
</Response>
```

### Exemple : Messagerie vocale
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">
    Veuillez laisser un message après le bip.
  </Say>
  <Record maxLength="60" action="/webhook/voice/recording" />
</Response>
```

---

## 🔐 Sécurité

### Validation
- Vérifier ownership du numéro émetteur
- Valider signature Twilio webhook
- Rate limiting sur initiation d'appels
- Autorisation JWT sur tous endpoints

### Webhooks
- Valider `X-Twilio-Signature` header
- Rejeter requêtes non-Twilio
- Logs de toutes les tentatives

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

---

## 🧪 Tests Recommandés

### Test d'appel sortant
```bash
curl -X POST http://localhost:3005/api/calls/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+33123456789",
    "to": "+33987654321"
  }'
```

### Test webhook (ngrok requis)
```bash
# 1. Démarrer service
npm run dev

# 2. Exposer avec ngrok
ngrok http 3005

# 3. Configurer webhook Twilio
# Voice URL: https://xxx.ngrok.io/webhook/voice

# 4. Appeler le numéro Twilio
# Le webhook devrait recevoir l'appel
```

---

## 🚀 Déploiement Railway

### Variables d'environnement
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_VOICE_WEBHOOK_URL=https://your-app.railway.app/webhook/voice
TWILIO_STATUS_CALLBACK_URL=https://your-app.railway.app/webhook/voice/status
```

### Configuration Twilio
1. Aller dans **Twilio Console** → **Phone Numbers**
2. Pour chaque numéro :
   - **Voice & Fax → Voice URL** : `https://your-app.railway.app/webhook/voice` (POST)
   - **Status Callback URL** : `https://your-app.railway.app/webhook/voice/status` (POST)

---

## 📱 Mobile Integration (Phase 2)

### iOS (CallKit)
```swift
// Push notification pour appel entrant
let update = CXCallUpdate()
update.remoteHandle = CXHandle(type: .phoneNumber, value: fromNumber)
provider.reportNewIncomingCall(with: UUID(), update: update)
```

### Android (Telecom Framework)
```kotlin
// Notification d'appel entrant
val extras = Bundle()
extras.putString(TelecomManager.EXTRA_INCOMING_CALL_ADDRESS, fromNumber)
telecomManager.addNewIncomingCall(phoneAccountHandle, extras)
```

---

## ✅ Checklist Finale

- [ ] Appels sortants fonctionnent
- [ ] Appels entrants via webhook fonctionnent
- [ ] TwiML généré correctement
- [ ] Historique sauvegardé en DB
- [ ] Status updates (ringing → in-progress → completed)
- [ ] Durée et coût calculés
- [ ] Métriques qualité récupérées
- [ ] Dashboard mis à jour (Call Service 100%)
- [ ] Déployé sur Railway

---

## 📈 Progression Phase 1 Attendue

**Après Call Service :**
- Auth Service : 100%
- 2FA TOTP : 100%
- Numbers Service : 100%
- Messaging Service : 100%
- **Call Service : 100%** ✨
- Billing Service : 0%
- Mobile iOS : 0%
- Mobile Android : 0%

**Total : 62.5% (5/8 features)**

---

**Dernière mise à jour :** 2026-02-24
**Status :** 🚧 En cours
