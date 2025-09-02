import express from 'express';

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
    service: 'adaptalyfe-medical-app',
    version: '1.0.0'
  });
});

// API routes for medical app
app.get('/api/demo/users', (req, res) => {
  res.json([
    { id: 1, name: 'Demo User', email: 'demo@adaptalyfe.com', role: 'patient' }
  ]);
});

app.get('/api/demo/tasks', (req, res) => {
  res.json([
    { id: 1, title: 'Take morning medication', completed: false, category: 'health' },
    { id: 2, title: 'Log mood rating', completed: true, category: 'wellness' }
  ]);
});

// Serve React app for all routes
app.get('*', (req, res) => {
  res.sendFile('/app/dist/public/index.html', (err) => {
    if (err) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Adaptalyfe Medical App</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .status { color: green; }
          </style>
        </head>
        <body>
          <h1>🏥 Adaptalyfe Medical App</h1>
          <p class="status">✅ Service running - Frontend loading...</p>
          <p>The comprehensive medical app is deploying. Refresh in a moment to access all features.</p>
        </body>
        </html>
      `);
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Adaptalyfe Medical App running on port ${PORT}`);
  console.log(`📱 Health check available at /health`);
  console.log(`🩺 Medical app features ready for development`);
});

export default app;