import Stripe from 'stripe';
import { AppError } from '../middleware/errorHandler';
import { PRICING_TIERS, SubscriptionTier } from '../utils/pricing';

// Initialize Stripe
const getStripeClient = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new AppError('Stripe secret key not configured', 500);
  }

  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });
};

export const stripeService = {
  /**
   * Create a Stripe customer
   */
  createCustomer: async (email: string, name?: string): Promise<Stripe.Customer> => {
    try {
      const stripe = getStripeClient();

      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'commpro',
        },
      });

      return customer;
    } catch (error: any) {
      console.error('Stripe create customer error:', error);
      throw new AppError(error.message || 'Failed to create customer', 500);
    }
  },

  /**
   * Create a subscription
   */
  createSubscription: async (
    customerId: string,
    tier: SubscriptionTier,
    trialDays: number = 14
  ): Promise<Stripe.Subscription> => {
    try {
      const stripe = getStripeClient();

      // Get price ID from environment (created in Stripe Dashboard)
      const priceIdKey = `STRIPE_${tier}_PRICE_ID`;
      const priceId = process.env[priceIdKey];

      if (!priceId) {
        throw new AppError(`Price ID not configured for tier: ${tier}`, 500);
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error: any) {
      console.error('Stripe create subscription error:', error);
      throw new AppError(error.message || 'Failed to create subscription', 500);
    }
  },

  /**
   * Update subscription (change tier)
   */
  updateSubscription: async (
    subscriptionId: string,
    newTier: SubscriptionTier
  ): Promise<Stripe.Subscription> => {
    try {
      const stripe = getStripeClient();

      // Get new price ID
      const priceIdKey = `STRIPE_${newTier}_PRICE_ID`;
      const newPriceId = process.env[priceIdKey];

      if (!newPriceId) {
        throw new AppError(`Price ID not configured for tier: ${newTier}`, 500);
      }

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Update to new price
      const updated = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations', // Prorate immediately
      });

      return updated;
    } catch (error: any) {
      console.error('Stripe update subscription error:', error);
      throw new AppError(error.message || 'Failed to update subscription', 500);
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (subscriptionId: string): Promise<Stripe.Subscription> => {
    try {
      const stripe = getStripeClient();

      const subscription = await stripe.subscriptions.cancel(subscriptionId);

      return subscription;
    } catch (error: any) {
      console.error('Stripe cancel subscription error:', error);
      throw new AppError(error.message || 'Failed to cancel subscription', 500);
    }
  },

  /**
   * Attach payment method to customer
   */
  attachPaymentMethod: async (
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> => {
    try {
      const stripe = getStripeClient();

      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return paymentMethod;
    } catch (error: any) {
      console.error('Stripe attach payment method error:', error);
      throw new AppError(error.message || 'Failed to attach payment method', 500);
    }
  },

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod: async (
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> => {
    try {
      const stripe = getStripeClient();

      const customer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return customer;
    } catch (error: any) {
      console.error('Stripe set default payment method error:', error);
      throw new AppError(error.message || 'Failed to set default payment method', 500);
    }
  },

  /**
   * List invoices for customer
   */
  listInvoices: async (customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> => {
    try {
      const stripe = getStripeClient();

      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
      });

      return invoices.data;
    } catch (error: any) {
      console.error('Stripe list invoices error:', error);
      throw new AppError(error.message || 'Failed to list invoices', 500);
    }
  },

  /**
   * Get invoice details
   */
  getInvoice: async (invoiceId: string): Promise<Stripe.Invoice> => {
    try {
      const stripe = getStripeClient();

      const invoice = await stripe.invoices.retrieve(invoiceId);

      return invoice;
    } catch (error: any) {
      console.error('Stripe get invoice error:', error);
      throw new AppError(error.message || 'Failed to retrieve invoice', 500);
    }
  },

  /**
   * Validate Stripe webhook signature
   */
  validateWebhook: (payload: string | Buffer, signature: string): Stripe.Event => {
    try {
      const stripe = getStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      return event;
    } catch (error: any) {
      console.error('Webhook validation error:', error);
      throw new AppError('Invalid webhook signature', 400);
    }
  },
};
