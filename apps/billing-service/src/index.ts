import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import billingRoutes from './routes/billingRoutes';
import statusRoutes from './routes/statusRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { billingController } from './controllers/billingController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Security middleware
app.use(helmet());
app.use(cors());

// Request logging
app.use(requestLogger);

// Webhook endpoint (before body parser to get raw body)
app.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  billingController.handleStripeWebhook
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/billing', billingRoutes);
app.use('/', statusRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Billing Service running on port ${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`💳 Stripe webhook: http://localhost:${PORT}/webhook/stripe`);
});

export default app;
