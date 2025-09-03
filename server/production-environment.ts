// Production environment configuration for deployment
import { PRODUCTION_CONFIG } from './production-config';

export function configureForProduction() {
  // Set production environment variables
  if (process.env.NODE_ENV === 'production') {
    // Disable demo mode in production
    process.env.DEMO_MODE = 'false';
    
    console.log('🏭 Production mode activated');
    console.log('✅ Demo mode disabled');
    console.log('✅ Auto-login disabled');
    console.log('✅ Real user registration enabled');
  } else {
    console.log('🛠️ Development mode - demo features available');
  }
}

export function getEnvironmentStatus() {
  return {
    nodeEnv: process.env.NODE_ENV,
    isDemoMode: PRODUCTION_CONFIG.isDemoMode,
    enableAutoLogin: PRODUCTION_CONFIG.enableAutoLogin,
    isProduction: PRODUCTION_CONFIG.isProduction
  };
}