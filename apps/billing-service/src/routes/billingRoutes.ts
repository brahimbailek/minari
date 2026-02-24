import { Router } from 'express';
import { billingController } from '../controllers/billingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * Subscription routes (protected)
 */
router.post('/subscribe', authMiddleware, billingController.subscribe);
router.get('/subscription', authMiddleware, billingController.getSubscription);
router.put('/subscription', authMiddleware, billingController.updateSubscription);
router.delete('/subscription', authMiddleware, billingController.cancelSubscription);

/**
 * Payment methods (protected)
 */
router.post('/payment-methods', authMiddleware, billingController.addPaymentMethod);

/**
 * Usage tracking (protected)
 */
router.get('/usage', authMiddleware, billingController.getUsage);

/**
 * Invoices (protected)
 */
router.get('/invoices', authMiddleware, billingController.getInvoices);

export default router;
