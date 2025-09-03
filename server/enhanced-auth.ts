import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, passwordSecurity, securityEvents } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { SecurityMiddleware } from './security-middleware';
import { AuditLogger } from './audit';

export class EnhancedAuth {
  
  // Enhanced password validation during registration/change
  static async validateAndHashPassword(password: string, userId?: number): Promise<{ valid: boolean; hash?: string; message?: string }> {
    // Check password strength
    const strengthCheck = SecurityMiddleware.validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return strengthCheck;
    }

    // Check for common passwords
    if (SecurityMiddleware.isCommonPassword(password)) {
      return { valid: false, message: 'This password is too common. Please choose a more unique password.' };
    }

    // If updating existing password, check it's not the same as current
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user && await bcrypt.compare(password, user.password)) {
        return { valid: false, message: 'New password must be different from your current password.' };
      }
    }

    // Hash the password
    const hash = await bcrypt.hash(password, 12); // High salt rounds for security
    return { valid: true, hash };
  }

  // Enhanced login with security tracking
  static async authenticateUser(username: string, password: string, req?: any): Promise<{ user?: any; error?: string; locked?: boolean }> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user) {
      await AuditLogger.logFailedAction('login', 'authentication', 'User not found', undefined, req);
      await this.logSecurityEvent(undefined, 'failed_login', 'low', `Login attempt for non-existent user: ${username}`, req);
      return { error: 'Invalid username or password' };
    }

    // Check if account is locked
    const [passwordSec] = await db.select().from(passwordSecurity).where(eq(passwordSecurity.userId, user.id));
    
    if (passwordSec?.lockedUntil && new Date() < passwordSec.lockedUntil) {
      await this.logSecurityEvent(user.id, 'account_locked_login_attempt', 'medium', 'Login attempt on locked account', req);
      return { error: 'Account is temporarily locked. Please try again later.', locked: true };
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      await this.handleFailedLogin(user.id, req);
      await AuditLogger.logFailedAction('login', 'authentication', 'Invalid password', user.id, req);
      return { error: 'Invalid username or password' };
    }

    // Check if password change is required
    if (passwordSec?.requirePasswordChange) {
      return { error: 'Password change required. Please update your password.', user };
    }

    // Successful login - reset failed attempts
    await this.resetFailedAttempts(user.id);
    await AuditLogger.logUserAction(user.id, 'login', 'authentication', user.id.toString(), undefined, req);
    
    return { user };
  }

  // Handle failed login attempts with progressive lockout
  static async handleFailedLogin(userId: number, req?: any): Promise<void> {
    const [passwordSec] = await db.select().from(passwordSecurity).where(eq(passwordSecurity.userId, userId));
    
    const failedAttempts = (passwordSec?.failedLoginAttempts || 0) + 1;
    const now = new Date();
    
    let lockedUntil: Date | undefined;
    let severity = 'low';
    
    // Progressive lockout policy
    if (failedAttempts >= 5) {
      // Lock for 30 minutes after 5 attempts
      lockedUntil = new Date(now.getTime() + 30 * 60 * 1000);
      severity = 'medium';
    } else if (failedAttempts >= 10) {
      // Lock for 2 hours after 10 attempts
      lockedUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      severity = 'high';
    }

    // Update password security record
    if (passwordSec) {
      await db.update(passwordSecurity)
        .set({
          failedLoginAttempts: failedAttempts,
          lastFailedLogin: now,
          lockedUntil
        })
        .where(eq(passwordSecurity.userId, userId));
    } else {
      await db.insert(passwordSecurity).values({
        userId,
        failedLoginAttempts: failedAttempts,
        lastFailedLogin: now,
        lockedUntil
      });
    }

    // Log security event
    await this.logSecurityEvent(
      userId,
      'failed_login_attempt',
      severity as any,
      `Failed login attempt ${failedAttempts}/10. ${lockedUntil ? 'Account locked until ' + lockedUntil.toISOString() : ''}`,
      req
    );
  }

  // Reset failed login attempts after successful login
  static async resetFailedAttempts(userId: number): Promise<void> {
    await db.update(passwordSecurity)
      .set({
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        lockedUntil: null
      })
      .where(eq(passwordSecurity.userId, userId));
  }

  // Log security events
  static async logSecurityEvent(
    userId: number | undefined,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    req?: any
  ): Promise<void> {
    await db.insert(securityEvents).values({
      userId,
      eventType,
      severity,
      description,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      additionalData: {
        url: req?.url,
        method: req?.method,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Check if password needs to be changed (90 days policy)
  static async checkPasswordExpiry(userId: number): Promise<boolean> {
    const [passwordSec] = await db.select().from(passwordSecurity).where(eq(passwordSecurity.userId, userId));
    
    if (!passwordSec?.lastPasswordChange) return false;
    
    const daysSinceChange = Math.floor(
      (Date.now() - passwordSec.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceChange >= 90;
  }

  // Force password change
  static async requirePasswordChange(userId: number, reason: string): Promise<void> {
    await db.update(passwordSecurity)
      .set({ requirePasswordChange: true })
      .where(eq(passwordSecurity.userId, userId));
    
    await this.logSecurityEvent(userId, 'password_change_required', 'medium', `Password change required: ${reason}`);
  }

  // Update password with security tracking
  static async changePassword(userId: number, newPassword: string, req?: any): Promise<{ success: boolean; message: string }> {
    const validation = await this.validateAndHashPassword(newPassword, userId);
    
    if (!validation.valid) {
      return { success: false, message: validation.message || 'Invalid password' };
    }

    // Update user password
    await db.update(users)
      .set({ password: validation.hash })
      .where(eq(users.id, userId));

    // Update password security record
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    await db.update(passwordSecurity)
      .set({
        lastPasswordChange: now,
        passwordExpiry: expiryDate,
        requirePasswordChange: false,
        failedLoginAttempts: 0,
        lockedUntil: null
      })
      .where(eq(passwordSecurity.userId, userId));

    await AuditLogger.logUserAction(userId, 'password_change', 'authentication', userId.toString(), { passwordChangeReason: 'user_initiated' }, req);
    await this.logSecurityEvent(userId, 'password_changed', 'low', 'User changed password successfully', req);

    return { success: true, message: 'Password changed successfully' };
  }

  // Get security status for user dashboard
  static async getSecurityStatus(userId: number): Promise<any> {
    const [passwordSec] = await db.select().from(passwordSecurity).where(eq(passwordSecurity.userId, userId));
    
    const passwordExpired = await this.checkPasswordExpiry(userId);
    const daysSinceChange = passwordSec?.lastPasswordChange 
      ? Math.floor((Date.now() - passwordSec.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      passwordExpired,
      daysSinceLastChange: daysSinceChange,
      failedLoginAttempts: passwordSec?.failedLoginAttempts || 0,
      accountLocked: passwordSec?.lockedUntil && new Date() < passwordSec.lockedUntil,
      requirePasswordChange: passwordSec?.requirePasswordChange || false,
      twoFactorEnabled: passwordSec?.twoFactorEnabled || false
    };
  }
}