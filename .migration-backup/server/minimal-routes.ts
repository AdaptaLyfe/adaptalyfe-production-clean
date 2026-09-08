import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateUser, requireAuth } from "./auth";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Minimal routes without any potential Vite dependencies
export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const PgSession = connectPgSimple(session);
  
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Basic auth endpoints
  app.post('/api/login', authenticateUser);
  
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // User endpoint
  app.get('/api/user', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Basic subscription endpoint
  app.get('/api/subscription', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return basic subscription info
      res.json({
        id: user.id,
        planType: user.subscriptionTier || 'free',
        status: 'active'
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Basic tasks endpoint
  app.get('/api/daily-tasks', requireAuth, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Other minimal endpoints
  app.get('/api/user-preferences', requireAuth, async (req, res) => {
    res.json({ id: 1, userId: req.session.userId, notificationSettings: {} });
  });

  app.get('/api/mood-entries/today', requireAuth, async (req, res) => {
    res.json([]);
  });

  app.get('/api/bills', requireAuth, async (req, res) => {
    res.json([]);
  });

  const httpServer = createServer(app);
  return httpServer;
}