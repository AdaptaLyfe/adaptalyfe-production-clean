import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'adaptalyfe-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  });
});

export { healthRouter };