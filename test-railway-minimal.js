// Minimal Railway test server
const express = require('express');
const app = express();

app.use(express.json());

// Simple test API route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Railway API working', timestamp: new Date().toISOString() });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'demo2025') {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Catch-all for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.send('<html><body><h1>Railway Test App</h1><p>API available at /api/test</p></body></html>');
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Minimal Railway test server running on port ${port}`);
});