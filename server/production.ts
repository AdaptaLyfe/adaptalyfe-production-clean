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
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "https://api.stripe.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
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
      'https://adaptalyfe-db-production.up.railway.app',
      'https://app.getadaptalyfeapp.com',
      'capacitor://localhost',
      'ionic://localhost'
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
    
    // Allow getadaptalyfeapp.com subdomains
    if (origin && origin.includes('.getadaptalyfeapp.com')) {
      console.log('CORS allowing getadaptalyfeapp.com subdomain:', origin);
      return callback(null, true);
    }
    
    console.log('CORS REJECTED origin:', origin);
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting - only apply to API routes, not static files
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 for better user experience
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static files
    const skipPaths = ['/assets/', '.css', '.js', '.png', '.ico', '.json', '.html'];
    return skipPaths.some(path => req.path.includes(path));
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased from 10 for better UX
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Only rate limit API routes
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Global cache prevention middleware - apply to ALL responses
app.use((req, res, next) => {
  // Aggressive no-cache headers for HTML and non-asset files
  if (!req.path.startsWith('/assets/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
  }
  next();
});

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

  // Production static file serving
  console.log("Setting up production static file serving");
  const distPath = path.resolve(import.meta.dirname, "public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }

  // Cache-busting static file serving (ChatGPT recommendations)
  // Long cache for hashed assets (CSS/JS with fingerprints)
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "365d",
    immutable: true,
    etag: true
  }));

  // No cache for HTML and other files to prevent deep caching issues
  app.use(express.static(distPath, {
    maxAge: 0,
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.endsWith('/')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }
    }
  }));
  
  // Return 404 for missing static asset files instead of falling through to SPA
  app.get("/assets/*", (req, res) => {
    res.status(404).send('Not found');
  });

  // Serve index.html for all non-API routes (SPA fallback) with no-cache headers
  app.get("*", (req, res) => {
    // Don't serve HTML for API routes - let them return 404 naturally
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: `API endpoint not found: ${req.path}` });
    }

    // Don't serve HTML for static file extensions (prevents MIME type errors)
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map', '.json', '.webp', '.avif'];
    if (staticExtensions.some(ext => req.path.endsWith(ext))) {
      return res.status(404).send('Not found');
    }
    
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`🚀 AdaptaLyfe server running on port ${port} in PRODUCTION mode`);
    log(`serving on port ${port}`);
    
    // Start the task reminder service
    taskReminderService.start();
    console.log("🔔 Task reminder service initialized");
  });
})();