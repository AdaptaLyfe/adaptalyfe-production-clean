import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import path from "path";
import fs from "fs";
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

// CORS - Allow all Railway domains
app.use(cors({
  origin: true, // Allow all origins for Railway
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

// Force NODE_ENV to production for Railway
process.env.NODE_ENV = 'production';

async function startServer() {
  console.log('🚀 Starting Railway server...');
  
  // Register all API routes first - this is critical
  const server = await registerRoutes(app);
  
  // Only serve static files AFTER API routes are registered
  const distPath = path.resolve(import.meta.dirname, "public");
  console.log('Looking for static files at:', distPath);
  
  if (fs.existsSync(distPath)) {
    console.log('✅ Found static files, serving from:', distPath);
    app.use(express.static(distPath));
    
    // SPA fallback - MUST come after API routes
    app.get("*", (req, res, next) => {
      // Explicit check to prevent API routes from falling through
      if (req.path.startsWith('/api/')) {
        console.log(`❌ API route not found: ${req.method} ${req.path}`);
        return res.status(404).json({ 
          error: `API endpoint not found: ${req.path}`,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`📄 Serving SPA for: ${req.path}`);
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    console.log('❌ No static files found at:', distPath);
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: `API endpoint not found: ${req.path}` });
      }
      res.status(404).json({ error: 'Static files not found' });
    });
  }

  const port = process.env.PORT || 5000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Railway server running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  });
}

startServer().catch(console.error);