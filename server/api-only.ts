import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();

// Trust proxy for Railway
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

// CORS - Allow all origins for API-only server
app.use(cors({
  origin: true, // Allow all origins since this is API-only
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.',
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Force production mode
process.env.NODE_ENV = 'production';

async function startApiServer() {
  console.log('🚀 Starting API-only server for Railway...');
  
  // Register all API routes
  const server = await registerRoutes(app);
  
  // API-only server - NO static file serving
  // All routes should start with /api/
  app.get("/", (req, res) => {
    res.json({ 
      message: "Adaptalyfe API Server", 
      version: "1.0.0",
      endpoints: ["/api/health", "/api/login", "/api/debug"],
      timestamp: new Date().toISOString()
    });
  });
  
  // Catch-all for non-API routes
  app.get("*", (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        error: `API endpoint not found: ${req.path}`,
        availableEndpoints: ["/api/health", "/api/login", "/api/debug"]
      });
    }
    
    // Non-API routes get redirected to frontend
    res.status(200).json({ 
      message: "This is an API-only server. Frontend is hosted separately.",
      apiBase: req.protocol + '://' + req.get('host'),
      requestedPath: req.path
    });
  });

  const port = process.env.PORT || 5000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 API-only server running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 API Base URL: http://localhost:${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  });
}

startApiServer().catch(console.error);