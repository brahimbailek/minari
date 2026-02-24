import { z } from 'zod';

/**
 * Subscribe schema
 */
export const subscribeSchema = z.object({
  tier: z.enum(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']),
  paymentMethodId: z.string().optional(), // Stripe payment method ID
});

/**
 * Update subscription schema
 */
export const updateSubscriptionSchema = z.object({
  tier: z.enum(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']),
});

/**
 * Add payment method schema
 */
export const addPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>;
