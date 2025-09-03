import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { registerRoutes } from "./routes";
import { auditMiddleware } from "./audit";
import path from "path";
import fs from "fs";
import { initializeComprehensiveDemo } from "./demo-data";
import { taskReminderService } from "./task-reminder-service";

// Simple log function 
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

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

// CORS configuration - Railway compatible
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5000', 
      'http://127.0.0.1:5000',
      'https://adaptalyfe-5a1d3.web.app',
      'https://adaptalyfe-5a1d3.firebaseapp.com',
      'https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev',
      'https://adaptalyfe-db-production.up.railway.app'
    ];
    
    // Allow any Railway domain
    if (origin && (origin.includes('.railway.app') || origin.includes('.up.railway.app'))) {
      console.log('CORS allowing Railway origin:', origin);
      return callback(null, true);
    }
    
    // Check allowed origins
    if (allowedOrigins.includes(origin)) {
      console.log('CORS allowing known origin:', origin);
      return callback(null, true);
    }
    
    console.log('CORS rejected origin:', origin);
    callback(null, true); // Allow all for now to debug
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
    try {
      // Dynamic import to avoid bundling Vite in production
      const viteModule = await import("./vite.js");
      await viteModule.setupVite(app, server);
    } catch (error) {
      console.error("Failed to load Vite in development:", error);
      // Fallback to static serving even in development
      const distPath = path.resolve(import.meta.dirname, "public");
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          // Don't serve HTML for API routes
          if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: `API endpoint not found: ${req.path}` });
          }
          res.sendFile(path.resolve(distPath, "index.html"));
        });
      }
    }
  } else {
    console.log("Setting up static file serving for production");
    // Serve static files directly without Vite
    const distPath = path.resolve(import.meta.dirname, "public");
    
    if (!fs.existsSync(distPath)) {
      throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    }

    app.use(express.static(distPath));
    
    // Serve index.html for all non-API routes (SPA fallback)
    app.get("*", (req, res) => {
      // Don't serve HTML for API routes - let them return proper 404 JSON
      if (req.path.startsWith('/api/')) {
        console.log(`API route not found: ${req.method} ${req.path}`);
        return res.status(404).json({ message: `API endpoint not found: ${req.path}` });
      }
      res.sendFile(path.resolve(distPath, "index.html"));
    });
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
    
    // Start the task reminder service
    taskReminderService.start();
    console.log("🔔 Task reminder service initialized");
  });
})();
