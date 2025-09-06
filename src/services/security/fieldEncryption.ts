/**
 * Field-Level Encryption Service
 * Provides transparent encryption/decryption for sensitive database fields
 * HIPAA-compliant PHI (Protected Health Information) encryption
 */

import { cryptoService } from './cryptoService';

// Fields that should always be encrypted
const ENCRYPTED_FIELDS = new Set([
  'email',
  'phone',
  'ssn',
  'medicalRecordNumber',
  'notes',
  'sessionNotes',
  'diagnosis',
  'medication',
  'emergencyContact',
  'address',
  'dateOfBirth',
  'insuranceInfo',
  'therapeuticNotes',
  'crisisAssessment',
  'safetyPlan',
  'mood_notes',
  'therapy_notes',
  'personal_notes'
]);

// Field types that require encryption
const SENSITIVE_FIELD_PATTERNS = [
  /.*notes?$/i,
  /.*comment.*$/i,
  /.*message.*$/i,
  /.*content.*$/i,
  /.*description.*$/i,
  /.*details.*$/i,
  /.*assessment.*$/i,
  /.*plan.*$/i,
  /phone|email|address|ssn/i,
  /medical|health|therapeutic/i,
  /crisis|emergency|safety/i
];

interface EncryptedField {
  value: string;
  encrypted: boolean;
  fieldName: string;
  timestamp: string;
}

class FieldEncryptionService {
  private static instance: FieldEncryptionService;

  private constructor() {}

  static getInstance(): FieldEncryptionService {
    if (!FieldEncryptionService.instance) {
      FieldEncryptionService.instance = new FieldEncryptionService();
    }
    return FieldEncryptionService.instance;
  }

  /**
   * Determine if a field should be encrypted
   */
  shouldEncrypt(fieldName: string): boolean {
    // Check explicit field list
    if (ENCRYPTED_FIELDS.has(fieldName)) {
      return true;
    }

    // Check pattern matching
    return SENSITIVE_FIELD_PATTERNS.some(pattern => 
      pattern.test(fieldName)
    );
  }

  /**
   * Encrypt a field value if it should be encrypted
   */
  async encryptFieldIfNeeded(fieldName: string, value: any): Promise<any> {
    // Only encrypt string values
    if (typeof value !== 'string' || !value) {
      return value;
    }

    // Check if field should be encrypted
    if (!this.shouldEncrypt(fieldName)) {
      return value;
    }

    try {
      const encrypted = await cryptoService.encryptField(value, fieldName);
      return {
        value: encrypted,
        encrypted: true,
        fieldName,
        timestamp: new Date().toISOString()
      } as EncryptedField;
    } catch (error) {
      console.error(`Failed to encrypt field ${fieldName}:`, error);
      // In case of encryption failure, log error but don't store unencrypted sensitive data
      throw new Error(`Critical: Failed to encrypt sensitive field ${fieldName}`);
    }
  }

  /**
   * Decrypt a field value if it's encrypted
   */
  async decryptFieldIfNeeded(fieldName: string, value: any): Promise<any> {
    // Check if value is an encrypted field object
    if (this.isEncryptedField(value)) {
      try {
        return await cryptoService.decryptField(value.value, fieldName);
      } catch (error) {
        console.error(`Failed to decrypt field ${fieldName}:`, error);
        throw new Error(`Failed to decrypt field ${fieldName}`);
      }
    }

    // Return as-is if not encrypted
    return value;
  }

  /**
   * Encrypt all eligible fields in an object
   */
  async encryptObject<T extends Record<string, any>>(obj: T): Promise<T> {
    const result = { ...obj };

    for (const [key, value] of Object.entries(result)) {
      if (value !== null && value !== undefined) {
        result[key] = await this.encryptFieldIfNeeded(key, value);
      }
    }

    return result;
  }

  /**
   * Decrypt all encrypted fields in an object
   */
  async decryptObject<T extends Record<string, any>>(obj: T): Promise<T> {
    const result = { ...obj };

    for (const [key, value] of Object.entries(result)) {
      if (value !== null && value !== undefined) {
        result[key] = await this.decryptFieldIfNeeded(key, value);
      }
    }

    return result;
  }

  /**
   * Check if a value is an encrypted field
   */
  private isEncryptedField(value: any): value is EncryptedField {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof value.value === 'string' &&
      value.encrypted === true &&
      typeof value.fieldName === 'string' &&
      typeof value.timestamp === 'string'
    );
  }

  /**
   * Safely log object with encrypted fields hidden
   */
  getSafeObjectForLogging<T extends Record<string, any>>(obj: T): T {
    const result = { ...obj };

    for (const [key, value] of Object.entries(result)) {
      if (this.shouldEncrypt(key)) {
        result[key] = this.isEncryptedField(value) ? '[ENCRYPTED]' : '[SENSITIVE]';
      }
    }

    return result;
  }

  /**
   * Create a searchable hash for encrypted fields
   * Allows searching without decryption
   */
  async createSearchableHash(fieldName: string, value: string): Promise<string> {
    // Use a deterministic hash for searching (less secure but searchable)
    // In production, consider using format-preserving encryption or tokenization
    const salt = `search_${fieldName}_salt`;
    return await cryptoService.hash(value.toLowerCase().trim(), salt);
  }

  /**
   * Encrypt data for specific user context
   */
  async encryptForUser(userId: string, fieldName: string, value: string): Promise<string> {
    const contextData = `user_${userId}_${fieldName}`;
    const result = await cryptoService.encrypt(value, contextData);
    return JSON.stringify(result);
  }

  /**
   * Decrypt data for specific user context
   */
  async decryptForUser(userId: string, fieldName: string, encryptedValue: string): Promise<string> {
    const contextData = `user_${userId}_${fieldName}`;
    const params = JSON.parse(encryptedValue);
    return await cryptoService.decrypt(params, contextData);
  }

  /**
   * Batch encrypt multiple fields
   */
  async batchEncrypt(fields: Array<{ name: string; value: string }>): Promise<Array<{ name: string; encrypted: any }>> {
    const results = [];

    for (const field of fields) {
      const encrypted = await this.encryptFieldIfNeeded(field.name, field.value);
      results.push({
        name: field.name,
        encrypted
      });
    }

    return results;
  }

  /**
   * Batch decrypt multiple fields
   */
  async batchDecrypt(fields: Array<{ name: string; encrypted: any }>): Promise<Array<{ name: string; value: any }>> {
    const results = [];

    for (const field of fields) {
      const value = await this.decryptFieldIfNeeded(field.name, field.encrypted);
      results.push({
        name: field.name,
        value
      });
    }

    return results;
  }

  /**
   * Validate that all sensitive fields are properly encrypted
   */
  validateEncryption<T extends Record<string, any>>(obj: T): { valid: boolean; unencryptedFields: string[] } {
    const unencryptedFields: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (this.shouldEncrypt(key)) {
        if (typeof value === 'string' && !this.isEncryptedField(value)) {
          // String value in a field that should be encrypted
          unencryptedFields.push(key);
        } else if (!this.isEncryptedField(value) && value !== null && value !== undefined) {
          // Non-null value that's not properly encrypted
          unencryptedFields.push(key);
        }
      }
    }

    return {
      valid: unencryptedFields.length === 0,
      unencryptedFields
    };
  }
}

// Export singleton instance
export const fieldEncryption = FieldEncryptionService.getInstance();
export { EncryptedField };

// Utility functions for database integration
export const encryptSensitiveFields = async <T extends Record<string, any>>(obj: T): Promise<T> => {
  return fieldEncryption.encryptObject(obj);
};

export const decryptSensitiveFields = async <T extends Record<string, any>>(obj: T): Promise<T> => {
  return fieldEncryption.decryptObject(obj);
};

export const isFieldSensitive = (fieldName: string): boolean => {
  return fieldEncryption.shouldEncrypt(fieldName);
};