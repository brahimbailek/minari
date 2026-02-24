import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import callsRoutes from './routes/callsRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Load environment variables
dotenv.config();

console.log('🔧 Starting CommPro Call Service...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('📍 Port from ENV:', process.env.PORT || '(not set, using 3005)');

const app = express();
const PORT = parseInt(process.env.PORT || '3005', 10);

console.log('✅ Express app created, will listen on port:', PORT);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'call-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/calls', callsRoutes);

// Webhook routes (at root level for easier Twilio configuration)
app.use('/', callsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Start server
console.log(`🎯 Attempting to listen on port ${PORT}...`);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Call Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📞 Twilio voice webhook: http://localhost:${PORT}/webhook/voice`);
  console.log(`✅ Server started successfully!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
