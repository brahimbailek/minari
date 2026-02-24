#!/bin/bash

# Railway Environment Variables Template
# Copy and fill in your actual values

echo "📋 Railway Environment Variables Template"
echo "=========================================="
echo ""

echo "🔐 TWILIO CREDENTIALS (Numbers, Messaging, Call services)"
echo "TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "TWILIO_PHONE_NUMBER=+1234567890"
echo ""

echo "💳 STRIPE CREDENTIALS (Billing service)"
echo "STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxx"
echo "STRIPE_BUSINESS_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxx"
echo "STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxx"
echo ""

echo "🔑 ENCRYPTION KEY (Messaging service)"
echo "Generate with: node scripts/generate-encryption-key.js"
echo "ENCRYPTION_KEY=<generated-key>"
echo ""

echo "✅ JWT SECRETS (Already configured in 'front' service)"
echo "JWT_SECRET=\${{front.JWT_SECRET}}"
echo "INTERNAL_SERVICE_SECRET=\${{front.INTERNAL_SERVICE_SECRET}}"
echo ""

echo "💾 DATABASE (Already configured)"
echo "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo "REDIS_URL=\${{Redis.REDIS_URL}}"
