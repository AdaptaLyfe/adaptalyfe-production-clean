import express from "express";
import { createServer } from "http";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());
app.use(express.static('dist/public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'adaptalyfe-medical-app'
  });
});

// API routes
app.get('/api/demo/users', (req, res) => {
  res.json([
    { id: 1, name: 'Demo User', email: 'demo@adaptalyfe.com' }
  ]);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client/dist/index.html'));
});

const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Adaptalyfe Medical App running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});

export default app;