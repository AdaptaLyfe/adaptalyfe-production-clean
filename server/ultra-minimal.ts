import express from "express";
import path from "path";
import fs from "fs";

const app = express();

// Ultra minimal setup - no external dependencies that could import Vite
app.use(express.json());
app.use(express.static("dist/public"));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'ultra-minimal' });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Ultra minimal server working' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.resolve('dist/public/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Ultra minimal server running on port ${port}`);
});

export default app;