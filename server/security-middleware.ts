import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AuditLogger } from "./audit";

// Enhanced security middleware for sensitive data handling
export class SecurityMiddleware {
  
  // Add security headers for sensitive pages
  static sensitivePageHeaders(req: Request, res: Response, next: NextFunction) {
    // Prevent caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  }

  // Generate CSRF tokens for forms
  static generateCSRFToken(req: any): string {
    const token = crypto.randomBytes(32).toString('hex');
    req.session.csrfToken = token;
    return token;
  }

  // Validate CSRF tokens
  static validateCSRF(req: any, res: Response, next: NextFunction) {
    const sessionToken = req.session.csrfToken;
    const requestToken = req.headers['x-csrf-token'] || req.body.csrfToken;
    
    if (!sessionToken || !requestToken || sessionToken !== requestToken) {
      AuditLogger.logFailedAction('csrf_validation', 'security', 'Invalid CSRF token', req.session.userId, req);
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
    
    next();
  }

  // Log suspicious activity
  static detectSuspiciousActivity(req: any, res: Response, next: NextFunction) {
    const suspiciousPatterns = [
      /[<>'"&]/g, // Potential XSS
      /union|select|drop|delete|insert|update/gi, // SQL injection attempts
      /(script|javascript|vbscript)/gi, // Script injection
    ];

    const requestData = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query,
      headers: req.headers
    });

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestData)) {
        AuditLogger.logFailedAction(
          'suspicious_activity',
          'security',
          `Suspicious pattern detected: ${pattern.source}`,
          req.session?.userId,
          req
        );
        break;
      }
    }

    next();
  }

  // Enhanced session security
  static validateSession(req: any, res: Response, next: NextFunction) {
    if (!req.session) {
      return res.status(401).json({ message: 'Session required' });
    }

    // Check session age (24 hours)
    const sessionAge = Date.now() - (req.session.createdAt || 0);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (sessionAge > maxAge) {
      req.session.destroy();
      return res.status(401).json({ message: 'Session expired' });
    }

    // Update last activity
    req.session.lastActivity = new Date();
    
    next();
  }

  // Data sanitization
  static sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .trim();
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return data;
  }

  // Enhanced password validation
  static validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    
    return { valid: true };
  }

  // Check for common weak passwords
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'password1'
    ];
    
    return commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    );
  }
}