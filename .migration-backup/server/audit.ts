import { db } from "./db";
import { auditLogs } from "@shared/schema";

export interface AuditLogEntry {
  userId?: number;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class AuditLogger {
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        success: entry.success,
        errorMessage: entry.errorMessage,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging should not break the main application
    }
  }

  static async logUserAction(
    userId: number,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      success: true,
      metadata,
    });
  }

  static async logFailedAction(
    action: string,
    resource: string,
    error: string,
    userId?: number,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      success: false,
      errorMessage: error,
    });
  }

  static async logDataAccess(
    userId: number,
    dataType: string,
    operation: 'read' | 'create' | 'update' | 'delete',
    recordId?: string,
    req?: any
  ): Promise<void> {
    await this.logUserAction(
      userId,
      `data_${operation}`,
      dataType,
      recordId,
      { operation, dataType },
      req
    );
  }

  static async logAuthentication(
    action: 'login' | 'logout' | 'failed_login',
    username?: string,
    userId?: number,
    req?: any
  ): Promise<void> {
    await this.log({
      userId,
      action: `auth_${action}`,
      resource: 'authentication',
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      success: action !== 'failed_login',
      metadata: { username },
    });
  }
}

// Middleware to automatically log API requests
export function auditMiddleware(req: any, res: any, next: any) {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const userId = req.user?.id;
    const method = req.method;
    const path = req.path;
    const statusCode = res.statusCode;
    
    // Log the API request
    AuditLogger.log({
      userId,
      action: `api_${method.toLowerCase()}`,
      resource: path,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: statusCode < 400,
      errorMessage: statusCode >= 400 ? `HTTP ${statusCode}` : undefined,
      metadata: {
        method,
        statusCode,
        responseSize: data ? JSON.stringify(data).length : 0,
      },
    });

    return originalSend.call(this, data);
  };

  next();
}