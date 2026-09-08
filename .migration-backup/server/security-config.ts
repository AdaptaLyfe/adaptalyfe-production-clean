export const SecurityConfig = {
  // Session configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    inactivityTimeout: 2 * 60 * 60 * 1000, // 2 hours of inactivity
    secureCookies: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  },

  // Rate limiting configuration
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'development' ? 1000 : 100,
      message: 'Too many requests from this IP, please try again later.',
    },
    authentication: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts
      message: 'Too many login attempts, please try again later.',
    },
    sensitiveData: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10, // 10 requests for medical/financial data
      message: 'Too many requests for sensitive data, please slow down.',
    },
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },

  // Data encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },

  // Audit logging configuration
  audit: {
    logAllRequests: false,
    logSensitiveOperations: true,
    retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    alertThresholds: {
      failedLogins: 3,
      suspiciousActivity: 1,
      dataExport: 1,
    },
  },

  // HIPAA compliance settings
  hipaa: {
    requireDataProcessingConsent: true,
    minimumRetentionPeriod: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years
    automaticLogout: true,
    dataExportNotification: true,
    breachNotificationRequired: true,
  },

  // Password policy
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    maxPasswordAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  },

  // File upload restrictions
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ],
    scanForMalware: process.env.NODE_ENV === 'production',
  },

  // Sensitive endpoints that require additional protection
  sensitiveEndpoints: [
    '/api/medical',
    '/api/pharmacy',
    '/api/banking',
    '/api/personal-documents',
    '/api/export-data',
    '/api/caregiver',
    '/api/admin',
  ],
};

export default SecurityConfig;