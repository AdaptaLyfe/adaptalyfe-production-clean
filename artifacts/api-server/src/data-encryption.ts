import crypto from 'crypto';
import { SecurityConfig } from './security-config';

export class DataEncryption {
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 
    crypto.scryptSync('adaptalyfe-secret-key', 'salt', 32);
  
  // Encrypt sensitive data
  static encryptSensitiveData(data: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(SecurityConfig.encryption.ivLength);
    const cipher = crypto.createCipher(SecurityConfig.encryption.algorithm, this.ENCRYPTION_KEY);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // For GCM mode, get the authentication tag
    const tag = (cipher as any).getAuthTag?.() || Buffer.alloc(0);
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt sensitive data
  static decryptSensitiveData(encrypted: string, iv: string, tag?: string): string {
    try {
      const decipher = crypto.createDecipher(SecurityConfig.encryption.algorithm, this.ENCRYPTION_KEY);
      
      // For GCM mode, set the auth tag if provided
      if (tag && (decipher as any).setAuthTag) {
        (decipher as any).setAuthTag(Buffer.from(tag, 'hex'));
      }
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  // Hash sensitive identifiers (like SSN, medical IDs)
  static hashSensitiveId(id: string): string {
    return crypto
      .createHash('sha256')
      .update(id + process.env.HASH_SALT || 'adaptalyfe-salt')
      .digest('hex');
  }

  // Generate secure random tokens
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Encrypt database fields that contain PII/PHI
  static encryptDatabaseField(value: string): string {
    if (!value) return value;
    
    const { encrypted, iv, tag } = this.encryptSensitiveData(value);
    return JSON.stringify({ encrypted, iv, tag });
  }

  // Decrypt database fields that contain PII/PHI
  static decryptDatabaseField(encryptedValue: string): string {
    if (!encryptedValue) return encryptedValue;
    
    try {
      const { encrypted, iv, tag } = JSON.parse(encryptedValue);
      return this.decryptSensitiveData(encrypted, iv, tag);
    } catch (error) {
      // If it's not encrypted JSON, return as-is (backwards compatibility)
      return encryptedValue;
    }
  }

  // Mask sensitive data for logging
  static maskSensitiveData(data: any, fieldsToMask: string[] = []): any {
    const defaultMaskedFields = [
      'password', 'ssn', 'creditCard', 'bankAccount', 'routingNumber',
      'medicalId', 'insuranceId', 'phoneNumber', 'email', 'address'
    ];
    
    const fieldsToCheck = [...defaultMaskedFields, ...fieldsToMask];
    
    if (typeof data === 'object' && data !== null) {
      const masked: any = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        const shouldMask = fieldsToCheck.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        );
        
        if (shouldMask && typeof value === 'string') {
          masked[key] = '*'.repeat(Math.min(value.length, 8));
        } else if (typeof value === 'object') {
          masked[key] = this.maskSensitiveData(value, fieldsToMask);
        } else {
          masked[key] = value;
        }
      }
      
      return masked;
    }
    
    return data;
  }

  // Validate data integrity
  static createDataHash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  // Verify data integrity
  static verifyDataIntegrity(data: string, hash: string): boolean {
    const calculatedHash = this.createDataHash(data);
    return calculatedHash === hash;
  }
}