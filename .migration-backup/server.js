// Standalone production server - no external dependencies
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'dist', 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    app: 'Adaptalyfe Production Server',
    version: '1.0.0'
  });
});

// API placeholder endpoints (for now just health)
app.get('/api/*', (req, res) => {
  res.status(503).json({ 
    message: 'API temporarily unavailable - static deployment',
    endpoint: req.path 
  });
});

// Serve React app for all routes
app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'dist', 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('App not found - check build process');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Standalone Adaptalyfe server running on port ${PORT}`);
  console.log('✅ No Vite dependencies - pure production server');
  console.log('✅ Serving static React app with health checks');
});