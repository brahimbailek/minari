import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@commpro/database';
import { stripeService } from '../services/stripeService';
import { AppError } from '../middleware/errorHandler';
import {
  subscribeSchema,
  updateSubscriptionSchema,
  addPaymentMethodSchema,
} from '../utils/validation';
import { SubscriptionTier, PRICING_TIERS } from '../utils/pricing';

const prisma = new PrismaClient();

export const billingController = {
  /**
   * Subscribe to a tier
   * POST /api/billing/subscribe
   */
  subscribe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { tier, paymentMethodId } = subscribeSchema.parse(req.body);

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if already subscribed
      if (user.subscription) {
        throw new AppError('User already has an active subscription', 400);
      }

      // Create Stripe customer
      const customerName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || undefined;
      const customer = await stripeService.createCustomer(user.email, customerName);
      const stripeCustomerId = customer.id;

      // Attach payment method if provided
      if (paymentMethodId) {
        await stripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);
        await stripeService.setDefaultPaymentMethod(stripeCustomerId, paymentMethodId);
      }

      // Create Stripe subscription (skip for FREE tier)
      let stripeSubscription: any = null;
      let stripeSubscriptionId: string | null = null;

      if (tier !== 'FREE') {
        stripeSubscription = await stripeService.createSubscription(
          stripeCustomerId,
          tier,
          14 // 14 days trial
        );
        stripeSubscriptionId = stripeSubscription.id;
      }

      const tierLimits = PRICING_TIERS[tier];

      // Save subscription to database
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          tier,
          status: stripeSubscription ? (stripeSubscription.status === 'active' ? 'ACTIVE' : 'TRIALING') : 'ACTIVE',
          stripeSubscriptionId,
          stripeCustomerId,
          currentPeriodStart: stripeSubscription
            ? new Date(stripeSubscription.current_period_start * 1000)
            : new Date(),
          currentPeriodEnd: stripeSubscription
            ? new Date(stripeSubscription.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for FREE
          cancelAtPeriodEnd: false,
          amount: tierLimits.price,
        },
      });

      res.status(201).json({
        message: 'Subscription created successfully',
        subscription: {
          id: subscription.id,
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialEnd: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get subscription details
   * GET /api/billing/subscription
   */
  getSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        return res.status(404).json({
          message: 'No active subscription',
          subscription: null,
        });
      }

      const tierLimits = PRICING_TIERS[subscription.tier];

      res.json({
        subscription: {
          id: subscription.id,
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          limits: tierLimits,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update subscription (change tier)
   * PUT /api/billing/subscription
   */
  updateSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { tier } = updateSubscriptionSchema.parse(req.body);

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new AppError('No active subscription found', 404);
      }

      if (subscription.tier === tier) {
        throw new AppError('Already subscribed to this tier', 400);
      }

      // Update in Stripe (if subscription exists)
      let stripeSubscription: any = null;
      if (subscription.stripeSubscriptionId) {
        stripeSubscription = await stripeService.updateSubscription(
          subscription.stripeSubscriptionId,
          tier
        );
      }

      const tierLimits = PRICING_TIERS[tier];

      // Update in database
      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          tier,
          amount: tierLimits.price,
          currentPeriodStart: stripeSubscription
            ? new Date(stripeSubscription.current_period_start * 1000)
            : subscription.currentPeriodStart,
          currentPeriodEnd: stripeSubscription
            ? new Date(stripeSubscription.current_period_end * 1000)
            : subscription.currentPeriodEnd,
        },
      });

      res.json({
        message: 'Subscription updated successfully',
        subscription: {
          id: updated.id,
          tier: updated.tier,
          status: updated.status,
          currentPeriodEnd: updated.currentPeriodEnd,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel subscription
   * DELETE /api/billing/subscription
   */
  cancelSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new AppError('No active subscription found', 404);
      }

      // Cancel in Stripe (if subscription exists)
      if (subscription.stripeSubscriptionId) {
        await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
      }

      // Update in database
      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      res.json({
        message: 'Subscription will be canceled at the end of the billing period',
        subscription: {
          id: updated.id,
          tier: updated.tier,
          status: updated.status,
          currentPeriodEnd: updated.currentPeriodEnd,
          cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add payment method
   * POST /api/billing/payment-methods
   */
  addPaymentMethod: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { paymentMethodId } = addPaymentMethodSchema.parse(req.body);

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new AppError('User does not have a subscription', 400);
      }

      // Attach payment method to customer
      const paymentMethod = await stripeService.attachPaymentMethod(
        paymentMethodId,
        subscription.stripeCustomerId
      );

      // Set as default
      await stripeService.setDefaultPaymentMethod(subscription.stripeCustomerId, paymentMethodId);

      res.status(201).json({
        message: 'Payment method added successfully',
        paymentMethod: {
          id: paymentMethod.id,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          expMonth: paymentMethod.card?.exp_month,
          expYear: paymentMethod.card?.exp_year,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get usage for current billing period
   * GET /api/billing/usage
   */
  getUsage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new AppError('No active subscription found', 404);
      }

      // Get usage stats for current period
      const currentPeriodStart = subscription.currentPeriodStart;
      const currentPeriodEnd = subscription.currentPeriodEnd;

      // Count SMS sent in current period
      const smsCount = await prisma.message.count({
        where: {
          userId,
          createdAt: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd,
          },
        },
      });

      // Count call minutes in current period
      const calls = await prisma.call.findMany({
        where: {
          userId,
          createdAt: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd,
          },
          status: 'COMPLETED',
        },
        select: {
          durationSeconds: true,
        },
      });

      const totalSeconds = calls.reduce((sum, call) => sum + (call.durationSeconds || 0), 0);
      const callMinutes = Math.ceil(totalSeconds / 60);

      // Count active numbers
      const numbersCount = await prisma.phoneNumber.count({
        where: {
          userId,
          status: 'ACTIVE',
        },
      });

      const tierLimits = PRICING_TIERS[subscription.tier];

      res.json({
        usage: {
          sms: {
            used: smsCount,
            limit: tierLimits.sms,
            percentage: Math.round((smsCount / tierLimits.sms) * 100),
          },
          callMinutes: {
            used: callMinutes,
            limit: tierLimits.callMinutes,
            percentage: Math.round((callMinutes / tierLimits.callMinutes) * 100),
          },
          numbers: {
            used: numbersCount,
            limit: tierLimits.numbers,
            percentage: Math.round((numbersCount / tierLimits.numbers) * 100),
          },
          periodStart: currentPeriodStart,
          periodEnd: currentPeriodEnd,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoices
   * GET /api/billing/invoices
   */
  getInvoices: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new AppError('No subscription found', 404);
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const invoices = await stripeService.listInvoices(subscription.stripeCustomerId, limit);

      res.json({
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          created: new Date(invoice.created * 1000),
          pdfUrl: invoice.invoice_pdf,
          hostedUrl: invoice.hosted_invoice_url,
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Stripe webhook handler
   * POST /webhook/stripe
   */
  handleStripeWebhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        throw new AppError('Missing stripe-signature header', 400);
      }

      // Validate webhook
      const event = stripeService.validateWebhook(req.body, signature);

      console.log('Stripe webhook event:', event.type);

      // Handle different event types
      switch (event.type) {
        case 'invoice.paid':
          // Invoice was paid successfully
          const paidInvoice = event.data.object as any;
          console.log('Invoice paid:', paidInvoice.id);
          break;

        case 'invoice.payment_failed':
          // Payment failed
          const failedInvoice = event.data.object as any;
          console.log('Payment failed:', failedInvoice.id);

          // Update subscription status
          if (failedInvoice.subscription) {
            await prisma.subscription.updateMany({
              where: { stripeSubscriptionId: failedInvoice.subscription },
              data: { status: 'PAST_DUE' },
            });
          }
          break;

        case 'customer.subscription.updated':
          // Subscription was updated
          const updatedSub = event.data.object as any;
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: updatedSub.id },
            data: {
              status: updatedSub.status === 'active' ? 'ACTIVE' : 'TRIALING',
              currentPeriodStart: new Date(updatedSub.current_period_start * 1000),
              currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
            },
          });
          break;

        case 'customer.subscription.deleted':
          // Subscription was canceled
          const deletedSub = event.data.object as any;
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: deletedSub.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
            },
          });
          break;

        default:
          console.log('Unhandled event type:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  },
};
