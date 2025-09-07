// Core Application Types
// This file contains the main TypeScript interfaces and type definitions
// for the Astral Core mental health platform

export * from './user';
export * from './auth';
export * from './crisis';
export * from './therapy';
export * from './community';
export * from './wellness';
export * from './platform';
export * from './analytics';
export * from './api';
export * from './websocket';
export * from './enums';

// Base Types
export type UUID = string;
export type Timestamp = Date | string;
export type Email = string;
export type PhoneNumber = string;
export type URL = string;

// Common Utility Types
export interface BaseEntity {
  id: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp | null;
}

export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: Timestamp;
  requestId?: string;
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ErrorResponse extends BaseResponse {
  error: string;
  code?: string | number;
  details?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  stack?: string; // Only in development
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Filter and Search Types
export interface BaseFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
}

export interface SearchOptions extends BaseFilter {
  includeDeleted?: boolean;
  fuzzySearch?: boolean;
  fields?: string[];
  facets?: string[];
}

// Permission and Security Types
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  conditions?: Record<string, any>;
}

export interface SecurityContext {
  userId: UUID;
  userRole: string;
  sessionId: UUID;
  permissions: Permission[];
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

// Audit and Logging Types
export interface AuditLog extends BaseEntity {
  userId: UUID;
  userEmail: Email;
  action: string;
  resource: string;
  resourceId?: UUID;
  details?: Record<string, any>;
  outcome: 'success' | 'failure' | 'error';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: UUID;
  duration?: number;
}

// File and Media Types
export interface FileInfo {
  id: UUID;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: URL;
  thumbnailUrl?: URL;
  isEncrypted: boolean;
  metadata?: Record<string, any>;
  uploadedAt: Timestamp;
  uploadedBy: UUID;
}

export interface MediaAttachment extends FileInfo {
  type: 'image' | 'video' | 'audio' | 'document';
  duration?: number; // For video/audio files
  dimensions?: {
    width: number;
    height: number;
  };
}

// Notification Types
export interface Notification extends BaseEntity {
  userId: UUID;
  type: 'info' | 'warning' | 'error' | 'success' | 'crisis_alert' | 'appointment' | 'message';
  title: string;
  message: string;
  isPriority: boolean;
  isRead: boolean;
  readAt?: Timestamp;
  actionUrl?: URL;
  actionText?: string;
  metadata?: Record<string, any>;
  expiresAt?: Timestamp;
}

// System Configuration Types
export interface SystemConfig {
  id: string;
  category: 'security' | 'features' | 'limits' | 'integrations';
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  isEncrypted: boolean;
  description?: string;
  defaultValue?: any;
  validationRules?: Record<string, any>;
  lastModifiedBy: UUID;
  lastModifiedAt: Timestamp;
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Timestamp;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis?: ServiceHealth;
    storage: ServiceHealth;
    email: ServiceHealth;
    websocket: ServiceHealth;
    external?: Record<string, ServiceHealth>;
  };
  metrics?: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastChecked: Timestamp;
  error?: string;
  details?: Record<string, any>;
}

// Rate Limiting Types
export interface RateLimit {
  identifier: string; // Usually user ID or IP
  resource: string;
  requestCount: number;
  windowStart: Timestamp;
  windowSize: number; // in milliseconds
  limit: number;
  remaining: number;
  resetTime: Timestamp;
}

// Task and Job Types
export interface BackgroundTask {
  id: UUID;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  payload: Record<string, any>;
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  scheduledFor?: Timestamp;
  priority: number;
}

// Encryption and Security
export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  algorithm: string;
  keyId: string;
  iv?: string; // Initialization vector for symmetric encryption
  tag?: string; // Authentication tag for AES-GCM
  timestamp: Timestamp;
}

export interface CryptoKey {
  id: UUID;
  type: 'aes-256-gcm' | 'rsa-2048' | 'ecdsa-p256';
  purpose: 'encryption' | 'signing' | 'kdf';
  status: 'active' | 'inactive' | 'revoked';
  publicKey?: string;
  keyMetadata: {
    algorithm: string;
    keySize: number;
    createdAt: Timestamp;
    expiresAt?: Timestamp;
    rotationDate?: Timestamp;
  };
}

// Feature Flags and A/B Testing
export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  conditions?: {
    userRoles?: string[];
    userIds?: UUID[];
    environment?: string[];
    startDate?: Timestamp;
    endDate?: Timestamp;
  };
  variants?: Array<{
    name: string;
    weight: number;
    payload?: Record<string, any>;
  }>;
  createdBy: UUID;
  lastModifiedBy: UUID;
  lastModifiedAt: Timestamp;
}

// Integration Types
export interface APICredentials {
  id: UUID;
  service: string;
  environment: 'development' | 'staging' | 'production';
  credentials: EncryptedData;
  isActive: boolean;
  expiresAt?: Timestamp;
  lastUsedAt?: Timestamp;
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

// Analytics and Metrics
export interface MetricPoint {
  timestamp: Timestamp;
  value: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface TimeSeries {
  metric: string;
  points: MetricPoint[];
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  interval: string; // e.g., '1m', '1h', '1d'
}

// Export Type Guards
export function isUUID(value: any): value is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === 'string' && uuidRegex.test(value);
}

export function isEmail(value: any): value is Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof value === 'string' && emailRegex.test(value);
}

export function isURL(value: any): value is URL {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isBaseEntity(value: any): value is BaseEntity {
  return (
    typeof value === 'object' &&
    value !== null &&
    isUUID(value.id) &&
    (value.createdAt instanceof Date || typeof value.createdAt === 'string') &&
    (value.updatedAt instanceof Date || typeof value.updatedAt === 'string')
  );
}

// Type Assertion Helpers
export function assertUUID(value: any, fieldName: string = 'id'): asserts value is UUID {
  if (!isUUID(value)) {
    throw new Error(`${fieldName} must be a valid UUID, received: ${value}`);
  }
}

export function assertEmail(value: any, fieldName: string = 'email'): asserts value is Email {
  if (!isEmail(value)) {
    throw new Error(`${fieldName} must be a valid email address, received: ${value}`);
  }
}

// Branded Types for Additional Type Safety
export type UserId = UUID & { readonly __brand: 'UserId' };
export type SessionId = UUID & { readonly __brand: 'SessionId' };
export type ConversationId = UUID & { readonly __brand: 'ConversationId' };
export type MessageId = UUID & { readonly __brand: 'MessageId' };
export type TherapySessionId = UUID & { readonly __brand: 'TherapySessionId' };
export type CrisisReportId = UUID & { readonly __brand: 'CrisisReportId' };

// Brand Type Constructors
export function createUserId(id: UUID): UserId {
  assertUUID(id);
  return id as UserId;
}

export function createSessionId(id: UUID): SessionId {
  assertUUID(id);
  return id as SessionId;
}

export function createConversationId(id: UUID): ConversationId {
  assertUUID(id);
  return id as ConversationId;
}

// Utility Types for API Endpoints
export type ApiResponse<T = any> = BaseResponse<T> | ErrorResponse;
export type ApiHandler<T = any> = (request: any) => Promise<ApiResponse<T>>;
export type ApiMiddleware = (request: any, response: any, next: () => void) => void | Promise<void>;