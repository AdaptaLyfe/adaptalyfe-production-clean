// Production configuration for soft launch
export const PRODUCTION_CONFIG = {
  // Environment detection
  isProduction: process.env.NODE_ENV === 'production',
  isDemoMode: process.env.DEMO_MODE === 'true' || false,
  
  // Demo controls - disabled for production readiness testing
  enableAutoLogin: false, // Disabled for soft launch
  enableDemoData: process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true',
  
  // Security settings
  requireStrictAuth: process.env.NODE_ENV === 'production',
  sessionSecret: process.env.SESSION_SECRET || 'demo-secret-key-change-in-production',
  
  // Feature flags for soft launch
  enableUserRegistration: true,
  enablePasswordReset: true,
  enableEmailVerification: false, // Can be enabled later
  
  // Logging
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info'
};

export function shouldAllowAutoLogin(): boolean {
  return PRODUCTION_CONFIG.enableAutoLogin;
}

export function shouldInitializeDemoData(): boolean {
  return PRODUCTION_CONFIG.enableDemoData;
}

export function isProductionMode(): boolean {
  return PRODUCTION_CONFIG.isProduction;
}