/**
 * Cryptography Service
 * Provides encryption, decryption, hashing, and key management
 * HIPAA-compliant implementation with AES-256-GCM encryption
 */

import { securityConfig } from '../../config/security.config';

interface EncryptionResult {
  encrypted: string;
  iv: string;
  salt?: string;
  tag: string;
}

interface DecryptionParams {
  encrypted: string;
  iv: string;
  salt?: string;
  tag: string;
}

class CryptographyService {
  private static instance: CryptographyService;
  private masterKey: CryptoKey | null = null;
  private derivedKeys: Map<string, CryptoKey> = new Map();
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = securityConfig.encryption.keyLength;
  private readonly IV_LENGTH = securityConfig.encryption.ivLength;
  private readonly SALT_LENGTH = securityConfig.encryption.saltLength;
  private readonly TAG_LENGTH = securityConfig.encryption.tagLength;
  private readonly PBKDF2_ITERATIONS = securityConfig.encryption.iterations;

  private constructor() {
    this.initializeCrypto();
  }

  static getInstance(): CryptographyService {
    if (!CryptographyService.instance) {
      CryptographyService.instance = new CryptographyService();
    }
    return CryptographyService.instance;
  }

  private async initializeCrypto(): Promise<void> {
    // Generate or retrieve master key
    await this.initializeMasterKey();
  }

  /**
   * Initialize or retrieve the master encryption key
   */
  private async initializeMasterKey(): Promise<void> {
    try {
      // Check if we have a stored master key
      const storedKey = this.getStoredMasterKey();
      
      if (storedKey) {
        // Import the stored key
        this.masterKey = await this.importKey(storedKey);
      } else {
        // Generate a new master key
        this.masterKey = await this.generateMasterKey();
        
        // Store the key securely (in production, use HSM or secure key storage)
        this.storeMasterKey(this.masterKey);
      }
    } catch (error) {
      console.error('Failed to initialize master key:', error);
      throw new Error('Cryptography initialization failed');
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(data: string, additionalData?: string): Promise<EncryptionResult> {
    try {
      if (!this.masterKey) {
        await this.initializeMasterKey();
      }

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Encode the data
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      
      // Prepare additional authenticated data if provided
      const aad = additionalData ? encoder.encode(additionalData) : undefined;
      
      // Encrypt the data
      const encryptParams: AesGcmParams = {
        name: this.ALGORITHM,
        iv: iv,
        ...(aad && { additionalData: aad }),
      };

      const encrypted = await crypto.subtle.encrypt(
        encryptParams,
        this.masterKey!,
        encodedData
      );

      // Extract the authentication tag (last 16 bytes)
      const encryptedArray = new Uint8Array(encrypted);
      const ciphertext = encryptedArray.slice(0, -this.TAG_LENGTH);
      const tag = encryptedArray.slice(-this.TAG_LENGTH);

      return {
        encrypted: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
        tag: this.arrayBufferToBase64(tag),
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(params: DecryptionParams, additionalData?: string): Promise<string> {
    try {
      if (!this.masterKey) {
        await this.initializeMasterKey();
      }

      // Convert base64 strings back to Uint8Arrays
      const encrypted = this.base64ToArrayBuffer(params.encrypted);
      const iv = this.base64ToArrayBuffer(params.iv);
      const tag = this.base64ToArrayBuffer(params.tag);

      // Combine ciphertext and tag
      const cipherWithTag = new Uint8Array(encrypted.byteLength + tag.byteLength);
      cipherWithTag.set(new Uint8Array(encrypted), 0);
      cipherWithTag.set(new Uint8Array(tag), encrypted.byteLength);

      // Prepare additional authenticated data if provided
      const encoder = new TextEncoder();
      const aad = additionalData ? encoder.encode(additionalData) : undefined;

      // Decrypt the data
      const decryptParams: AesGcmParams = {
        name: this.ALGORITHM,
        iv: iv,
        ...(aad && { additionalData: aad }),
      };

      const decrypted = await crypto.subtle.decrypt(
        decryptParams,
        this.masterKey!,
        cipherWithTag
      );

      // Decode the decrypted data
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate a hash using SHA-256
   */
  async hash(data: string, salt?: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataToHash = salt ? data + salt : data;
      const encodedData = encoder.encode(dataToHash);
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
      return this.arrayBufferToBase64(hashBuffer);
    } catch (error) {
      console.error('Hashing failed:', error);
      throw new Error('Hashing failed');
    }
  }

  /**
   * Generate a secure random salt
   */
  generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    return this.arrayBufferToBase64(salt);
  }

  /**
   * Derive a key from a password using PBKDF2
   */
  async deriveKey(password: string, salt: string): Promise<CryptoKey> {
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      const saltBuffer = this.base64ToArrayBuffer(salt);

      // Import the password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive the key
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: this.PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: this.ALGORITHM, length: this.KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
      );

      return derivedKey;
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Key derivation failed');
    }
  }

  /**
   * Generate a master key
   */
  private async generateMasterKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Import a key from raw key data
   */
  private async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: this.ALGORITHM },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Store the master key securely
   * In production, this should use HSM or secure key management service
   */
  private storeMasterKey(key: CryptoKey): void {
    // In development, we'll use localStorage (NOT for production)
    if (typeof window !== 'undefined' && securityConfig.environment === 'development') {
      crypto.subtle.exportKey('raw', key).then(keyData => {
        const keyString = this.arrayBufferToBase64(keyData);
        localStorage.setItem('astralcore_master_key', keyString);
      });
    }
    // In production, integrate with secure key management service
  }

  /**
   * Retrieve the stored master key
   */
  private getStoredMasterKey(): ArrayBuffer | null {
    // In development, retrieve from localStorage
    if (typeof window !== 'undefined' && securityConfig.environment === 'development') {
      const storedKey = localStorage.getItem('astralcore_master_key');
      if (storedKey) {
        return this.base64ToArrayBuffer(storedKey);
      }
    }
    // In production, retrieve from secure key management service
    return null;
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Encrypt field-level data for database storage
   */
  async encryptField(value: string, fieldName: string): Promise<string> {
    const result = await this.encrypt(value, fieldName);
    return JSON.stringify(result);
  }

  /**
   * Decrypt field-level data from database
   */
  async decryptField(encryptedValue: string, fieldName: string): Promise<string> {
    try {
      const params = JSON.parse(encryptedValue) as DecryptionParams;
      return await this.decrypt(params, fieldName);
    } catch (error) {
      console.error('Field decryption failed:', error);
      throw new Error('Field decryption failed');
    }
  }

  /**
   * Secure compare two strings (timing-safe)
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array.buffer);
  }
}

// Export singleton instance
export const cryptoService = CryptographyService.getInstance();
export { EncryptionResult, DecryptionParams };