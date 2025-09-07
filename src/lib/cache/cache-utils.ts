/**
 * Cache Utilities for AstralCore
 * Helper functions for cache keys, serialization, compression, and tagging
 * 
 * Features:
 * - Cache key generation and validation
 * - Data serialization/deserialization with type safety
 * - Compression for large cached objects
 * - Cache tagging for related data invalidation
 * - Cache warming utilities
 * - Performance monitoring helpers
 * - HIPAA-compliant data handling
 */

import { createHash, createHmac, randomBytes } from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

// Compression utilities
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

/**
 * Cache key utilities
 */
export class CacheKeyUtils {
  private static readonly KEY_SEPARATOR = ':';
  private static readonly MAX_KEY_LENGTH = 250; // Redis key length limit
  private static readonly FORBIDDEN_CHARS = /[\s\r\n\t]/g;
  
  /**
   * Generate a secure, consistent cache key
   */
  static generateKey(
    namespace: string,
    identifier: string,
    ...additionalParts: string[]
  ): string {
    const parts = [namespace, identifier, ...additionalParts]
      .filter(part => part && part.length > 0)
      .map(part => this.sanitizeKeyPart(part));
    
    const baseKey = parts.join(this.KEY_SEPARATOR);
    
    // If key is too long, hash the excess part
    if (baseKey.length > this.MAX_KEY_LENGTH) {
      const hashablePart = parts.slice(2).join(this.KEY_SEPARATOR);
      const hash = createHash('sha256').update(hashablePart).digest('hex').substring(0, 16);
      return `${parts[0]}${this.KEY_SEPARATOR}${parts[1]}${this.KEY_SEPARATOR}${hash}`;
    }
    
    return baseKey;
  }
  
  /**
   * Generate user-specific cache key
   */
  static generateUserKey(
    namespace: string,
    userId: string,
    resource: string,
    ...additionalParts: string[]
  ): string {
    return this.generateKey(namespace, `user:${userId}`, resource, ...additionalParts);
  }
  
  /**
   * Generate time-based cache key
   */
  static generateTimeBasedKey(
    namespace: string,
    identifier: string,
    timeGranularity: 'hour' | 'day' | 'week' | 'month'
  ): string {
    const now = new Date();
    let timePart: string;
    
    switch (timeGranularity) {
      case 'hour':
        timePart = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
        break;
      case 'day':
        timePart = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        break;
      case 'week':
        const weekNumber = this.getWeekNumber(now);
        timePart = `${now.getFullYear()}-W${weekNumber}`;
        break;
      case 'month':
        timePart = `${now.getFullYear()}-${now.getMonth()}`;
        break;
      default:
        timePart = now.toISOString().split('T')[0];
    }
    
    return this.generateKey(namespace, identifier, timePart);
  }
  
  /**
   * Generate key with expiration timestamp
   */
  static generateExpiringKey(
    namespace: string,
    identifier: string,
    expirationMinutes: number
  ): string {
    const expirationTime = new Date(Date.now() + expirationMinutes * 60000);
    const expirationPart = Math.floor(expirationTime.getTime() / (expirationMinutes * 60000));
    
    return this.generateKey(namespace, identifier, `exp:${expirationPart}`);
  }
  
  /**
   * Generate HMAC-signed cache key for sensitive data
   */
  static generateSecureKey(
    namespace: string,
    identifier: string,
    secret: string = process.env.CACHE_SECRET_KEY || 'default-secret'
  ): string {
    const baseKey = this.generateKey(namespace, identifier);
    const signature = createHmac('sha256', secret).update(baseKey).digest('hex').substring(0, 8);
    
    return `${baseKey}:sig:${signature}`;
  }
  
  /**
   * Validate cache key format
   */
  static validateKey(key: string): boolean {
    if (!key || key.length === 0) return false;
    if (key.length > this.MAX_KEY_LENGTH) return false;
    if (this.FORBIDDEN_CHARS.test(key)) return false;
    
    return true;
  }
  
  /**
   * Extract namespace from cache key
   */
  static extractNamespace(key: string): string | null {
    const parts = key.split(this.KEY_SEPARATOR);
    return parts.length > 0 ? parts[0] : null;
  }
  
  /**
   * Parse structured cache key
   */
  static parseKey(key: string): {
    namespace: string;
    identifier: string;
    additionalParts: string[];
  } | null {
    const parts = key.split(this.KEY_SEPARATOR);
    
    if (parts.length < 2) return null;
    
    return {
      namespace: parts[0],
      identifier: parts[1],
      additionalParts: parts.slice(2),
    };
  }
  
  /**
   * Sanitize key part to remove forbidden characters
   */
  private static sanitizeKeyPart(part: string): string {
    return part.replace(this.FORBIDDEN_CHARS, '_').trim();
  }
  
  /**
   * Get ISO week number
   */
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

/**
 * Data serialization utilities with type safety
 */
export class SerializationUtils {
  /**
   * Serialize data with metadata
   */
  static serialize<T>(data: T, options: {
    includeMetadata?: boolean;
    compress?: boolean;
    encrypt?: boolean;
  } = {}): string {
    const payload = {
      data,
      ...(options.includeMetadata && {
        metadata: {
          timestamp: Date.now(),
          type: typeof data,
          version: '1.0',
        },
      }),
    };
    
    const serialized = JSON.stringify(payload);
    
    // TODO: Add encryption if needed
    if (options.encrypt) {
      // This would use the HIPAAEncryption from redis-cache.ts
      console.warn('[SerializationUtils] Encryption not implemented in this utility');
    }
    
    return serialized;
  }
  
  /**
   * Deserialize data with type checking
   */
  static deserialize<T>(
    serialized: string,
    expectedType?: string
  ): { data: T; metadata?: any } | null {
    try {
      const parsed = JSON.parse(serialized);
      
      // Handle both old format (direct data) and new format (with metadata)
      if (parsed.hasOwnProperty('data')) {
        const { data, metadata } = parsed;
        
        // Type validation if expected type is provided
        if (expectedType && metadata?.type && metadata.type !== expectedType) {
          console.warn(`[SerializationUtils] Type mismatch: expected ${expectedType}, got ${metadata.type}`);
        }
        
        return { data: data as T, metadata };
      } else {
        // Legacy format - data is at root level
        return { data: parsed as T };
      }
    } catch (error) {
      console.error('[SerializationUtils] Deserialization error:', error);
      return null;
    }
  }
  
  /**
   * Serialize with JSON schema validation
   */
  static serializeWithSchema<T>(
    data: T,
    schema: any // JSON schema object
  ): string | null {
    // Basic validation (in a real implementation, you'd use ajv or similar)
    if (schema.type === 'object' && typeof data !== 'object') {
      console.error('[SerializationUtils] Schema validation failed: expected object');
      return null;
    }
    
    return this.serialize(data, { includeMetadata: true });
  }
  
  /**
   * Calculate serialized data size
   */
  static getSerializedSize(data: any): number {
    const serialized = this.serialize(data);
    return Buffer.byteLength(serialized, 'utf8');
  }
}

/**
 * Compression utilities for large cached objects
 */
export class CompressionUtils {
  private static readonly COMPRESSION_THRESHOLD = 1024; // 1KB
  private static readonly COMPRESSION_ALGORITHMS = {
    GZIP: 'gzip',
    DEFLATE: 'deflate',
  } as const;
  
  /**
   * Compress data using gzip
   */
  static async compressGzip(data: string | Buffer): Promise<string> {
    try {
      const input = typeof data === 'string' ? Buffer.from(data) : data;
      const compressed = await gzip(input);
      return compressed.toString('base64');
    } catch (error) {
      console.error('[CompressionUtils] Gzip compression error:', error);
      throw new Error('Gzip compression failed');
    }
  }
  
  /**
   * Decompress gzip data
   */
  static async decompressGzip(compressedData: string): Promise<string> {
    try {
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = await gunzip(buffer);
      return decompressed.toString();
    } catch (error) {
      console.error('[CompressionUtils] Gzip decompression error:', error);
      throw new Error('Gzip decompression failed');
    }
  }
  
  /**
   * Compress data using deflate
   */
  static async compressDeflate(data: string | Buffer): Promise<string> {
    try {
      const input = typeof data === 'string' ? Buffer.from(data) : data;
      const compressed = await deflate(input);
      return compressed.toString('base64');
    } catch (error) {
      console.error('[CompressionUtils] Deflate compression error:', error);
      throw new Error('Deflate compression failed');
    }
  }
  
  /**
   * Decompress deflate data
   */
  static async decompressDeflate(compressedData: string): Promise<string> {
    try {
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = await inflate(buffer);
      return decompressed.toString();
    } catch (error) {
      console.error('[CompressionUtils] Deflate decompression error:', error);
      throw new Error('Deflate decompression failed');
    }
  }
  
  /**
   * Auto-compress data based on size and content type
   */
  static async autoCompress(
    data: string,
    options: {
      threshold?: number;
      algorithm?: 'gzip' | 'deflate';
      forceCompress?: boolean;
    } = {}
  ): Promise<{ data: string; compressed: boolean; algorithm?: string; originalSize: number; compressedSize?: number }> {
    const threshold = options.threshold || this.COMPRESSION_THRESHOLD;
    const algorithm = options.algorithm || 'gzip';
    const originalSize = Buffer.byteLength(data, 'utf8');
    
    if (!options.forceCompress && originalSize < threshold) {
      return {
        data,
        compressed: false,
        originalSize,
      };
    }
    
    try {
      let compressedData: string;
      
      if (algorithm === 'gzip') {
        compressedData = await this.compressGzip(data);
      } else {
        compressedData = await this.compressDeflate(data);
      }
      
      const compressedSize = Buffer.byteLength(compressedData, 'utf8');
      
      // Only use compression if it actually saves space
      if (compressedSize >= originalSize && !options.forceCompress) {
        return {
          data,
          compressed: false,
          originalSize,
        };
      }
      
      return {
        data: compressedData,
        compressed: true,
        algorithm,
        originalSize,
        compressedSize,
      };
    } catch (error) {
      console.error('[CompressionUtils] Auto-compression error:', error);
      return {
        data,
        compressed: false,
        originalSize,
      };
    }
  }
  
  /**
   * Auto-decompress data
   */
  static async autoDecompress(
    data: string,
    compressed: boolean,
    algorithm?: string
  ): Promise<string> {
    if (!compressed || !algorithm) {
      return data;
    }
    
    try {
      if (algorithm === 'gzip') {
        return await this.decompressGzip(data);
      } else if (algorithm === 'deflate') {
        return await this.decompressDeflate(data);
      } else {
        console.warn(`[CompressionUtils] Unknown compression algorithm: ${algorithm}`);
        return data;
      }
    } catch (error) {
      console.error('[CompressionUtils] Auto-decompression error:', error);
      return data;
    }
  }
  
  /**
   * Calculate compression ratio
   */
  static calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize) * 100;
  }
}

/**
 * Cache tagging for related data invalidation
 */
export class CacheTagging {
  private static readonly TAG_PREFIX = 'tag:';
  private static readonly TAG_SEPARATOR = '|';
  
  /**
   * Generate cache key with tags
   */
  static generateTaggedKey(baseKey: string, tags: string[]): string {
    if (!tags.length) return baseKey;
    
    const tagString = tags.sort().join(this.TAG_SEPARATOR);
    const tagHash = createHash('sha256').update(tagString).digest('hex').substring(0, 8);
    
    return `${baseKey}:${this.TAG_PREFIX}${tagHash}`;
  }
  
  /**
   * Extract tags from tagged key
   */
  static extractTagHash(taggedKey: string): string | null {
    const tagPrefixIndex = taggedKey.lastIndexOf(`:${this.TAG_PREFIX}`);
    if (tagPrefixIndex === -1) return null;
    
    return taggedKey.substring(tagPrefixIndex + this.TAG_PREFIX.length + 1);
  }
  
  /**
   * Generate invalidation pattern for tags
   */
  static generateInvalidationPattern(tags: string[]): string {
    const tagString = tags.sort().join(this.TAG_SEPARATOR);
    const tagHash = createHash('sha256').update(tagString).digest('hex').substring(0, 8);
    
    return `*:${this.TAG_PREFIX}${tagHash}`;
  }
  
  /**
   * Tag-based cache key registry
   */
  static createTagRegistry(): Map<string, Set<string>> {
    return new Map();
  }
  
  /**
   * Register cache key with tags
   */
  static registerKeyWithTags(
    registry: Map<string, Set<string>>,
    key: string,
    tags: string[]
  ): void {
    tags.forEach(tag => {
      if (!registry.has(tag)) {
        registry.set(tag, new Set());
      }
      registry.get(tag)!.add(key);
    });
  }
  
  /**
   * Get keys by tag from registry
   */
  static getKeysByTag(
    registry: Map<string, Set<string>>,
    tag: string
  ): string[] {
    const keys = registry.get(tag);
    return keys ? Array.from(keys) : [];
  }
  
  /**
   * Remove key from tag registry
   */
  static removeKeyFromRegistry(
    registry: Map<string, Set<string>>,
    key: string,
    tags: string[]
  ): void {
    tags.forEach(tag => {
      const keys = registry.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          registry.delete(tag);
        }
      }
    });
  }
}

/**
 * Cache warming utilities
 */
export class CacheWarmingUtils {
  /**
   * Warm cache with batch data
   */
  static async warmWithBatch<T>(
    cacheInstance: any,
    cacheType: string,
    batchData: Map<string, T>,
    options: {
      ttl?: number;
      batchSize?: number;
      delayBetweenBatches?: number;
    } = {}
  ): Promise<void> {
    const batchSize = options.batchSize || 50;
    const delay = options.delayBetweenBatches || 100;
    
    const entries = Array.from(batchData.entries());
    const batches = this.chunkArray(entries, batchSize);
    
    console.log(`[CacheWarmingUtils] Warming ${entries.length} entries in ${batches.length} batches`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchMap = new Map(batch);
      
      try {
        await cacheInstance.batchSet(cacheType, batchMap, options.ttl);
        console.log(`[CacheWarmingUtils] Batch ${i + 1}/${batches.length} completed`);
        
        if (delay && i < batches.length - 1) {
          await this.sleep(delay);
        }
      } catch (error) {
        console.error(`[CacheWarmingUtils] Batch ${i + 1} failed:`, error);
      }
    }
  }
  
  /**
   * Progressive cache warming with priority
   */
  static async progressiveWarm<T>(
    warmerFunction: (priority: number) => Promise<Map<string, T>>,
    cacheFunction: (data: Map<string, T>) => Promise<void>,
    priorities: number[] = [1, 2, 3]
  ): Promise<void> {
    console.log('[CacheWarmingUtils] Starting progressive cache warming');
    
    for (const priority of priorities.sort()) {
      try {
        console.log(`[CacheWarmingUtils] Warming priority ${priority} data`);
        const data = await warmerFunction(priority);
        await cacheFunction(data);
        console.log(`[CacheWarmingUtils] Priority ${priority} warming completed`);
      } catch (error) {
        console.error(`[CacheWarmingUtils] Priority ${priority} warming failed:`, error);
      }
    }
    
    console.log('[CacheWarmingUtils] Progressive warming completed');
  }
  
  /**
   * Chunk array into smaller arrays
   */
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Performance monitoring utilities
 */
export class CachePerformanceUtils {
  private static performanceData: Map<string, {
    totalTime: number;
    callCount: number;
    errors: number;
  }> = new Map();
  
  /**
   * Measure cache operation performance
   */
  static async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number; success: boolean }> {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await operation();
      success = true;
      const duration = Date.now() - startTime;
      
      this.recordPerformance(operationName, duration, true);
      
      return { result, duration, success };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordPerformance(operationName, duration, false);
      throw error;
    }
  }
  
  /**
   * Record performance data
   */
  static recordPerformance(operationName: string, duration: number, success: boolean): void {
    if (!this.performanceData.has(operationName)) {
      this.performanceData.set(operationName, {
        totalTime: 0,
        callCount: 0,
        errors: 0,
      });
    }
    
    const data = this.performanceData.get(operationName)!;
    data.totalTime += duration;
    data.callCount += 1;
    
    if (!success) {
      data.errors += 1;
    }
  }
  
  /**
   * Get performance statistics
   */
  static getPerformanceStats(operationName?: string): Record<string, any> {
    if (operationName) {
      const data = this.performanceData.get(operationName);
      if (!data) return {};
      
      return {
        averageTime: data.totalTime / data.callCount,
        totalCalls: data.callCount,
        totalErrors: data.errors,
        errorRate: data.errors / data.callCount,
        totalTime: data.totalTime,
      };
    }
    
    const allStats: Record<string, any> = {};
    
    this.performanceData.forEach((data, operation) => {
      allStats[operation] = {
        averageTime: data.totalTime / data.callCount,
        totalCalls: data.callCount,
        totalErrors: data.errors,
        errorRate: data.errors / data.callCount,
        totalTime: data.totalTime,
      };
    });
    
    return allStats;
  }
  
  /**
   * Reset performance data
   */
  static resetPerformanceData(operationName?: string): void {
    if (operationName) {
      this.performanceData.delete(operationName);
    } else {
      this.performanceData.clear();
    }
  }
}

/**
 * HIPAA-compliant cache utilities
 */
export class HIPAACacheUtils {
  private static readonly SENSITIVE_FIELDS = new Set([
    'ssn',
    'socialSecurityNumber',
    'dateOfBirth',
    'dob',
    'address',
    'phoneNumber',
    'phone',
    'email',
    'emergencyContact',
    'medicalRecordNumber',
    'insuranceNumber',
  ]);
  
  /**
   * Sanitize data before caching (remove/mask sensitive fields)
   */
  static sanitizeForCache(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForCache(item));
    }
    
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      if (this.SENSITIVE_FIELDS.has(lowerKey)) {
        // Mask sensitive fields
        if (typeof value === 'string') {
          sanitized[key] = this.maskSensitiveValue(value);
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForCache(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Mask sensitive string values
   */
  private static maskSensitiveValue(value: string): string {
    if (value.length <= 4) {
      return '****';
    }
    
    const visibleChars = 2;
    const maskedChars = '*'.repeat(value.length - visibleChars * 2);
    
    return value.substring(0, visibleChars) + maskedChars + value.substring(value.length - visibleChars);
  }
  
  /**
   * Generate audit log entry for cache operations
   */
  static generateAuditLog(
    operation: 'GET' | 'SET' | 'DELETE',
    cacheKey: string,
    userId?: string,
    success: boolean = true
  ): {
    timestamp: string;
    operation: string;
    cacheKey: string;
    userId?: string;
    success: boolean;
    ipAddress?: string;
  } {
    return {
      timestamp: new Date().toISOString(),
      operation,
      cacheKey: this.hashSensitiveKey(cacheKey),
      userId,
      success,
      // In a real implementation, you'd get this from the request context
      ipAddress: 'unknown',
    };
  }
  
  /**
   * Hash sensitive cache keys for audit logging
   */
  private static hashSensitiveKey(key: string): string {
    return createHash('sha256').update(key).digest('hex').substring(0, 16);
  }
  
  /**
   * Validate that data doesn't contain forbidden sensitive information
   */
  static validateDataForCaching(data: any): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    
    this.findSensitiveFields(data, '', violations);
    
    return {
      valid: violations.length === 0,
      violations,
    };
  }
  
  /**
   * Recursively find sensitive fields in data
   */
  private static findSensitiveFields(
    data: any,
    path: string,
    violations: string[]
  ): void {
    if (typeof data !== 'object' || data === null) {
      return;
    }
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        this.findSensitiveFields(item, `${path}[${index}]`, violations);
      });
      return;
    }
    
    for (const [key, value] of Object.entries(data)) {
      const fieldPath = path ? `${path}.${key}` : key;
      const lowerKey = key.toLowerCase();
      
      if (this.SENSITIVE_FIELDS.has(lowerKey)) {
        violations.push(`Sensitive field found: ${fieldPath}`);
      }
      
      if (typeof value === 'object' && value !== null) {
        this.findSensitiveFields(value, fieldPath, violations);
      }
    }
  }
}

// Export all utilities
export {
  CacheKeyUtils,
  SerializationUtils,
  CompressionUtils,
  CacheTagging,
  CacheWarmingUtils,
  CachePerformanceUtils,
  HIPAACacheUtils,
};