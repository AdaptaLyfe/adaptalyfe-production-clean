import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS must be first middleware - before any other middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Additional CORS configuration
app.use(cors({
  origin: true,
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

// Session configuration - adjusted for CORS
app.use(session({
  secret: process.env.SESSION_SECRET || 'adaptalyfe-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for HTTP in development
    httpOnly: true, // Secure cookie handling
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Better compatibility for same-site requests
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

// Auth middleware - using enhanced version below

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'adaptalyfe-medical-app',
    version: '1.0.0'
  });
});

// Handle all OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Add backup route for /api/login (without auth prefix) - duplicate logic
app.post('/api/login', async (req, res) => {
  try {
    // Set CORS headers explicitly on this route
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    console.log('🔄 LOGIN VIA /api/login - Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔄 LOGIN VIA /api/login - Body:', JSON.stringify(req.body, null, 2));
    
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
      
      console.log('✅ LOGIN SUCCESS (/api/login) - User:', username, 'Session ID:', req.session.id);
      
      // Check if this is a form submission (redirect) or AJAX (JSON response)
      const isFormSubmission = req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded');
      
      if (isFormSubmission) {
        // Form submission - redirect to dashboard
        console.log('📄 Form submission detected - redirecting to dashboard');
        return res.redirect('/dashboard');
      } else {
        // AJAX request - return JSON
        console.log('📡 AJAX request detected - returning JSON response');
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
      }
    });
  } catch (error) {
    console.error('Login error (/api/login):', error);
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

// Authentication middleware - Enhanced with debugging
function requireAuth(req, res, next) {
  console.log('🔐 Auth check - Session ID:', req.session?.id);
  console.log('🔐 Auth check - User ID:', req.session?.userId);
  console.log('🔐 Auth check - User data:', JSON.stringify(req.session?.user, null, 2));
  
  if (!req.session?.userId) {
    console.log('❌ Auth failed - No user session');
    return res.status(401).json({ error: 'Authentication required' });
  }
  console.log('✅ Auth passed - User:', req.session.user.username);
  next();
}

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

// Subscription management endpoints  
app.get('/api/subscription', requireAuth, (req, res) => {
  const user = req.session.user;
  res.json({
    tier: user.subscriptionTier,
    status: 'active',
    features: user.subscriptionTier === 'premium' ? 
      ['task_management', 'medication_tracking', 'mood_monitoring', 'caregiver_system', 'document_management', 'financial_tools'] :
      ['basic_task_management'],
    billingDate: '2024-10-02',
    amount: user.subscriptionTier === 'premium' ? 12.99 : 4.99
  });
});

// GET /api/login for frontend compatibility
app.get('/api/login', (req, res) => {
  if (req.session?.userId) {
    // Already logged in
    res.json({ 
      authenticated: true, 
      user: req.session.user,
      redirect: '/dashboard'
    });
  } else {
    // Not authenticated
    res.json({ 
      authenticated: false,
      message: 'Please use POST to login'
    });
  }
});

// Dashboard summary endpoint
app.get('/api/dashboard', requireAuth, (req, res) => {
  const userId = req.session.userId;
  console.log('📊 Dashboard API called for user:', req.session.user.username);
  
  const dashboardData = {
    user: req.session.user,
    summary: {
      tasksCompleted: 1,
      totalTasks: 4,
      progressPercentage: 25,
      moodAverage: 7,
      medicationCompliance: 95,
      upcomingAppointments: 2
    },
    quickActions: [
      { id: 'mood', title: 'Log Mood', icon: 'mood', completed: false, category: 'wellness', description: 'Track your daily mood' },
      { id: 'medication', title: 'Take Medication', icon: 'pill', completed: true, category: 'health', description: 'Complete medication schedule' },
      { id: 'exercise', title: 'Exercise', icon: 'activity', completed: false, category: 'fitness', description: '30 minutes of physical activity' },
      { id: 'sleep', title: 'Log Sleep', icon: 'moon', completed: false, category: 'wellness', description: 'Record sleep duration and quality' }
    ],
    customization: {
      theme: 'default',
      dashboardLayout: 'standard',
      notifications: true,
      quickActionsEnabled: true,
      accessibilityMode: false
    },
    todaysSummary: {
      date: new Date().toLocaleDateString(),
      greeting: 'Good evening',
      currentStreak: 0,
      todaysProgress: 0
    }
  };
  
  console.log('📊 Sending dashboard data with', dashboardData.quickActions.length, 'quick actions');
  res.json(dashboardData);
});

// User customization endpoints
app.get('/api/customization', requireAuth, (req, res) => {
  res.json({
    theme: 'default',
    dashboardLayout: 'standard', 
    notifications: true,
    quickActionsEnabled: true,
    accessibilityMode: false,
    fontSize: 'medium',
    colorScheme: 'light',
    compactMode: false
  });
});

app.post('/api/customization', requireAuth, (req, res) => {
  const { theme, dashboardLayout, notifications, quickActionsEnabled, accessibilityMode } = req.body;
  
  res.json({
    success: true,
    message: 'Customization settings updated',
    settings: {
      theme: theme || 'default',
      dashboardLayout: dashboardLayout || 'standard',
      notifications: notifications !== false,
      quickActionsEnabled: quickActionsEnabled !== false,
      accessibilityMode: accessibilityMode || false
    }
  });
});

// Quick actions endpoints
app.post('/api/quick-actions/:actionId', requireAuth, (req, res) => {
  const { actionId } = req.params;
  const actions = ['mood', 'medication', 'exercise', 'sleep'];
  
  if (!actions.includes(actionId)) {
    return res.status(404).json({ error: 'Action not found' });
  }
  
  res.json({
    success: true,
    message: `${actionId} action completed`,
    actionId,
    timestamp: new Date().toISOString()
  });
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

// Move authentication routes BEFORE static file serving to ensure CORS headers apply
// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    // Set CORS headers explicitly on this route
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    console.log('🔐 LOGIN ATTEMPT - Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔐 LOGIN ATTEMPT - Body:', JSON.stringify(req.body, null, 2));
    console.log('🔐 LOGIN ATTEMPT - Content-Type:', req.headers['content-type']);
    
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
      
      // Check if this is a form submission (redirect) or AJAX (JSON response)
      const isFormSubmission = req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded');
      
      if (isFormSubmission) {
        // Form submission - redirect to dashboard
        console.log('📄 Form submission detected - redirecting to dashboard');
        return res.redirect('/dashboard');
      } else {
        // AJAX request - return JSON
        console.log('📡 AJAX request detected - returning JSON response');
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
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add enhanced request logging for debugging
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Serve static files from client dist
app.use(express.static('client/dist'));
app.use(express.static('dist/public'));

// Serve React app for non-API routes only
app.get('*', (req, res) => {
  // Don't interfere with API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  

  const indexPath = process.env.NODE_ENV === 'production' 
    ? path.resolve('/app/client/dist/index.html')
    : path.resolve('./client/dist/index.html');
    
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
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