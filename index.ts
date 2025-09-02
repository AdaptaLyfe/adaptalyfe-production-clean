import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { auditMiddleware } from "./audit";
import { initializeComprehensiveDemo } from "./demo-data";
import { taskReminderService } from "./task-reminder-service";
import { healthRouter } from "./health";

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Fixed CORS configuration for custom domain
app.use(cors({
  origin: function(origin, callback) {
    console.log('🔍 CORS Origin Check:', origin);
    
    // Allow requests with no origin (mobile apps, postman, etc)
    if (!origin) {
      console.log('✅ No origin - allowed');
      return callback(null, true);
    }
    
    // Always allow your custom domains regardless of NODE_ENV
    const allowedOrigins = [
      'http://localhost:5000', 
      'http://127.0.0.1:5000',
      'https://app.adaptalyfeapp.com',
      'https://adaptalyfeapp.com', 
      'https://adaptalyfe-5a1d3.web.app',
      'https://adaptalyfe-5a1d3.firebaseapp.com'
    ];
    
    // Also allow any Replit development domains
    if (allowedOrigins.includes(origin) || origin.includes('.replit.dev')) {
      console.log('✅ Origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('❌ Origin blocked:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use('/api/auth', authLimiter);

// Health check endpoint for Render
app.use(healthRouter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add audit logging middleware (temporarily disabled for testing)
// app.use(auditMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize comprehensive demo data
  await initializeComprehensiveDemo();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isDevelopment = process.env.NODE_ENV === "development";
  console.log(`Environment: ${process.env.NODE_ENV}, isDevelopment: ${isDevelopment}`);
  
  if (isDevelopment) {
    console.log("Setting up Vite development server");
    await setupVite(app, server);
  } else {
    console.log("Setting up static file serving for production");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`🚀 AdaptaLyfe server running on port ${port} in ${process.env.NODE_ENV} mode`);
    log(`serving on port ${port}`);
    
    // Temporarily disable task reminder service to prevent spam
    // taskReminderService.start();
    console.log("🔕 Task reminder service disabled (preventing spam)");
  });
})();
