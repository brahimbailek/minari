/**
 * Pricing tiers and limits for CommPro subscriptions
 */

export type SubscriptionTier = 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';

export interface TierLimits {
  name: string;
  price: number; // in cents (EUR)
  numbers: number;
  sms: number;
  callMinutes: number;
  features: string[];
}

export const PRICING_TIERS: Record<SubscriptionTier, TierLimits> = {
  FREE: {
    name: 'Free',
    price: 0, // 0€
    numbers: 0,
    sms: 0,
    callMinutes: 0,
    features: [
      'Plan gratuit',
      'Fonctionnalités limitées',
    ],
  },
  STARTER: {
    name: 'Starter',
    price: 900, // 9€
    numbers: 1,
    sms: 500,
    callMinutes: 100,
    features: [
      '1 numéro virtuel',
      '500 SMS/mois',
      '100 minutes d\'appels/mois',
      'Support email',
      'Historique 3 mois',
    ],
  },
  BUSINESS: {
    name: 'Business',
    price: 7900, // 79€
    numbers: 10,
    sms: 10000,
    callMinutes: 2000,
    features: [
      '10 numéros virtuels',
      '10000 SMS/mois',
      '2000 minutes d\'appels/mois',
      'Support 24/7',
      'Historique illimité',
      'API access',
      'Analytics avancés',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 0, // Custom pricing
    numbers: 999,
    sms: 999999,
    callMinutes: 999999,
    features: [
      'Numéros illimités',
      'SMS illimités',
      'Appels illimités',
      'Support dédié',
      'SLA 99.9%',
      'Custom features',
      'Compte manager',
    ],
  },
};

/**
 * Overage pricing (when limits exceeded)
 */
export const OVERAGE_PRICING = {
  sms: 5, // 0.05€ per SMS (in cents)
  callMinute: 15, // 0.15€ per minute (in cents)
  number: 300, // 3€ per extra number per month (in cents)
};

/**
 * Calculate overage cost
 */
export const calculateOverage = (
  tier: SubscriptionTier,
  usage: { sms: number; callMinutes: number; numbers: number }
): { smsOverage: number; callOverage: number; total: number } => {
  const limits = PRICING_TIERS[tier];

  const smsOverage = Math.max(0, usage.sms - limits.sms);
  const callOverage = Math.max(0, usage.callMinutes - limits.callMinutes);

  const smsCharge = smsOverage * OVERAGE_PRICING.sms;
  const callCharge = callOverage * OVERAGE_PRICING.callMinute;

  return {
    smsOverage,
    callOverage,
    total: smsCharge + callCharge,
  };
};

/**
 * Check if usage exceeds limits
 */
export const isWithinLimits = (
  tier: SubscriptionTier,
  usage: { sms: number; callMinutes: number; numbers: number }
): boolean => {
  const limits = PRICING_TIERS[tier];

  return (
    usage.sms <= limits.sms &&
    usage.callMinutes <= limits.callMinutes &&
    usage.numbers <= limits.numbers
  );
};
