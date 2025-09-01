// Vercel serverless function wrapper
import express from 'express';
import { registerRoutes } from '../server/routes.js';

const app = express();

// Initialize routes
await registerRoutes(app);

export default app;