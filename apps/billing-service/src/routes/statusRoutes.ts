import { Router } from 'express';

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    service: 'billing-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      subscriptions: 4,
      payments: 1,
      usage: 1,
      invoices: 1,
      webhooks: 1,
      total: 8,
    },
  });
});

export default router;
