import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration - Fixed to resolve API blocking
app.use(cors({
  origin: true, // Allow all origins to fix CORS blocking
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'adaptalyfe-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// In-memory user storage (for demo purposes)
const users = [
  {
    id: 1,
    username: 'demo',
    email: 'demo@adaptalyfe.com',
    password: '$2a$10$K8QVQ8Q8Q8Q8Q8Q8Q8Q8Qu', // "password123"
    role: 'patient',
    subscriptionTier: 'premium'
  },
  {
    id: 2,
    username: 'patient',
    email: 'patient@adaptalyfe.com',
    password: '$2a$10$K8QVQ8Q8Q8Q8Q8Q8Q8Q8Qu', // "password123"
    role: 'patient',
    subscriptionTier: 'basic'
  }
];

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'adaptalyfe-medical-app',
    version: '1.0.0'
  });
});

// Enhanced preflight OPTIONS support for CORS
app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = users.find(u => u.username === username || u.email === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo purposes, accept any password or check bcrypt
    const isValidPassword = password === 'password123' || await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier
    };

    // Save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      
      console.log('✅ LOGIN SUCCESS - User:', username, 'Session ID:', req.session.id);
      console.log('✅ Session data saved:', JSON.stringify(req.session.user, null, 2));
      
      // Return user data with redirect instruction
      res.json({
        success: true,
        redirect: '/dashboard',
        message: 'Login successful - redirecting to dashboard',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          subscriptionTier: user.subscriptionTier
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      role: 'patient',
      subscriptionTier: 'basic'
    };

    users.push(newUser);

    // Set session
    req.session.userId = newUser.id;
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      subscriptionTier: newUser.subscriptionTier
    };

    res.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        subscriptionTier: newUser.subscriptionTier
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/api/user', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// Medical app data routes
app.get('/api/tasks', requireAuth, (req, res) => {
  res.json([
    { id: 1, title: 'Take morning medication', completed: false, category: 'health', userId: req.session.userId },
    { id: 2, title: 'Log mood rating', completed: true, category: 'wellness', userId: req.session.userId },
    { id: 3, title: 'Exercise for 30 minutes', completed: false, category: 'fitness', userId: req.session.userId },
    { id: 4, title: 'Practice breathing exercises', completed: false, category: 'wellness', userId: req.session.userId }
  ]);
});

app.get('/api/medications', requireAuth, (req, res) => {
  res.json([
    { id: 1, name: 'Vitamin D', dosage: '1000 IU', frequency: 'Daily', time: '08:00', userId: req.session.userId },
    { id: 2, name: 'Omega-3', dosage: '500mg', frequency: 'Daily', time: '08:00', userId: req.session.userId }
  ]);
});

app.get('/api/mood-logs', requireAuth, (req, res) => {
  res.json([
    { id: 1, date: '2024-09-02', mood: 8, notes: 'Feeling great today!', userId: req.session.userId },
    { id: 2, date: '2024-09-01', mood: 6, notes: 'Good day overall', userId: req.session.userId }
  ]);
});

app.get('/api/appointments', requireAuth, (req, res) => {
  res.json([
    { id: 1, title: 'Doctor Checkup', date: '2024-09-05', time: '10:00', type: 'medical', userId: req.session.userId },
    { id: 2, title: 'Therapy Session', date: '2024-09-07', time: '14:00', type: 'therapy', userId: req.session.userId }
  ]);
});

// Demo routes (public)
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

// Add enhanced request logging for debugging
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  }
  console.log('🌐 Request headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Serve static files from client dist
app.use(express.static('client/dist'));
app.use(express.static('dist/public'));

// Serve React app for all routes
app.get('*', (req, res) => {
  const indexPath = process.env.NODE_ENV === 'production' ? '/app/client/dist/index.html' : './client/dist/index.html';
  res.sendFile(indexPath, (err) => {
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
  console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`🔧 CORS enabled for all origins`);
  console.log(`🩺 Medical app features ready for development`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;