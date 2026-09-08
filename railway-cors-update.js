// Update CORS configuration for Railway deployment
// Add this to your server configuration

app.use(cors({
  origin: [
    'http://localhost:5000', 
    'http://127.0.0.1:5000',
    'https://adaptalyfe-5a1d3.web.app',
    'https://adaptalyfe-5a1d3.firebaseapp.com',
    'https://your-app.railway.app', // Replace with your Railway URL
    'https://your-custom-domain.com', // Replace with your custom domain
    // Add your Railway domain here once deployed
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));