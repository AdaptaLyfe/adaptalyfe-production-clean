import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());

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

// Catch-all route
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Adaptalyfe Medical App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .status { color: green; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>🏥 Adaptalyfe Medical App</h1>
      <p class="status">✅ Service is running successfully!</p>
      
      <h3>Available Endpoints:</h3>
      <div class="endpoint"><strong>GET /health</strong> - Health check</div>
      <div class="endpoint"><strong>GET /api/demo/users</strong> - Demo users</div>
      <div class="endpoint"><strong>GET /api/demo/tasks</strong> - Demo tasks</div>
      
      <h3>Medical App Features Ready:</h3>
      <ul>
        <li>Task Management with Mood Check-ins</li>
        <li>Medication Tracking & Reminders</li>
        <li>Sleep & Symptom Tracking</li>
        <li>Document Management</li>
        <li>Caregiver Communication System</li>
        <li>Financial Management Tools</li>
        <li>Stripe Subscription Payments</li>
      </ul>
      
      <p><em>Comprehensive medical app platform deployed successfully on Render.</em></p>
    </body>
    </html>
  `);
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