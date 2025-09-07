import { NextRequest } from 'next/server';
import { BaseResponse, PaginatedResponse, UUID, Timestamp } from './index';
import { User, UserRole } from './user';
import { JWTPayload } from './auth';

// Extended Request Types
export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  session?: {
    id: UUID;
    userId: UUID;
    expiresAt: Timestamp;
  };
  token?: JWTPayload;
}

// API Response Types
export interface SuccessResponse<T = any> extends BaseResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
  code?: string | number;
  details?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

// Helper functions for API responses
export function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  error: string, 
  code?: string, 
  details?: ValidationError[]
): ErrorResponse {
  return {
    success: false,
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

// API Endpoint Types
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteHandler<TRequest = any, TResponse = any> {
  (request: AuthenticatedRequest, params?: Record<string, string>): Promise<Response>;
}

export interface APIRoute {
  path: string;
  method: HTTPMethod;
  handler: RouteHandler;
  middleware?: Middleware[];
  requiresAuth?: boolean;
  requiredRoles?: UserRole[];
  rateLimit?: APIRateLimitConfig;
  validation?: ValidationSchema;
  description?: string;
}

// Middleware Types
export type Middleware = (
  request: AuthenticatedRequest,
  response: Response,
  next: () => Promise<void>
) => Promise<void>;

export interface MiddlewareConfig {
  name: string;
  middleware: Middleware;
  order: number;
  routes?: string[];
  excludeRoutes?: string[];
}

// Rate Limiting
export interface APIRateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: AuthenticatedRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Timestamp;
  retryAfter?: number;
}

// Validation
export interface ValidationSchema {
  body?: Record<string, FieldValidation>;
  query?: Record<string, FieldValidation>;
  params?: Record<string, FieldValidation>;
  headers?: Record<string, FieldValidation>;
}

export interface FieldValidation {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'email' | 'url' | 'date';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => string | null; // Returns error message or null
  transform?: (value: any) => any;
  default?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any; // Transformed/sanitized data
}

// Pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Search and Filtering
export interface SearchOptions extends PaginationOptions {
  query?: string;
  filters?: Record<string, any>;
  facets?: string[];
  includeDeleted?: boolean;
  fuzzySearch?: boolean;
}

export interface ApiSearchResult<T> {
  items: T[];
  totalCount: number;
  facets?: Record<string, FacetResult[]>;
  suggestions?: string[];
  queryTime?: number; // in milliseconds
}

export interface FacetResult {
  value: string;
  count: number;
}

// File Upload
export interface FileUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[]; // MIME types
  allowedExtensions: string[];
  destination: string;
  preserveOriginalName?: boolean;
  generateThumbnails?: boolean;
  virusScan?: boolean;
}

export interface UploadedFile {
  id: UUID;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Timestamp;
  uploadedBy: UUID;
  metadata?: Record<string, any>;
}

export interface FileUploadResult {
  files: UploadedFile[];
  errors: Array<{
    fileName: string;
    error: string;
  }>;
}

// Caching
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string | ((request: AuthenticatedRequest) => string);
  invalidateOn?: string[]; // Events that should invalidate this cache
  tags?: string[];
  namespace?: string;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  tags?: string[];
}

// API Documentation
export interface APIDocumentation {
  version: string;
  title: string;
  description: string;
  baseUrl: string;
  authentication: {
    type: 'bearer' | 'api_key' | 'oauth2';
    description: string;
    tokenUrl?: string;
    authUrl?: string;
  };
  endpoints: EndpointDocumentation[];
  models: Record<string, ModelDocumentation>;
}

export interface EndpointDocumentation {
  path: string;
  method: HTTPMethod;
  summary: string;
  description?: string;
  tags?: string[];
  parameters?: ParameterDocumentation[];
  requestBody?: RequestBodyDocumentation;
  responses: Record<string, ResponseDocumentation>;
  security?: string[];
  examples?: Record<string, any>;
}

export interface ParameterDocumentation {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required: boolean;
  schema: SchemaDocumentation;
  example?: any;
}

export interface RequestBodyDocumentation {
  description?: string;
  required: boolean;
  content: Record<string, {
    schema: SchemaDocumentation;
    example?: any;
  }>;
}

export interface ResponseDocumentation {
  description: string;
  content?: Record<string, {
    schema: SchemaDocumentation;
    example?: any;
  }>;
  headers?: Record<string, HeaderDocumentation>;
}

export interface HeaderDocumentation {
  description?: string;
  schema: SchemaDocumentation;
  example?: any;
}

export interface SchemaDocumentation {
  type: string;
  properties?: Record<string, SchemaDocumentation>;
  items?: SchemaDocumentation;
  required?: string[];
  enum?: any[];
  example?: any;
  description?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

export interface ModelDocumentation {
  type: 'object';
  properties: Record<string, SchemaDocumentation>;
  required?: string[];
  description?: string;
  example?: any;
}

// Health Check
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Timestamp;
  version: string;
  environment: string;
  uptime: number; // in seconds
  services: ServiceHealthCheck[];
  metrics?: ApiSystemMetrics;
}

export interface ServiceHealthCheck {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number; // in milliseconds
  lastChecked: Timestamp;
  error?: string;
  details?: Record<string, any>;
}

export interface ApiSystemMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number; // percentage
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
  avgResponseTime: number;
}

// Batch Operations
export interface BatchRequest<T> {
  operations: BatchOperation<T>[];
  continueOnError?: boolean;
  transactional?: boolean;
}

export interface BatchOperation<T> {
  id: string;
  operation: 'create' | 'update' | 'delete';
  data: T;
}

export interface BatchResponse<T> {
  results: BatchResult<T>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  errors?: BatchError[];
}

export interface BatchResult<T> {
  id: string;
  status: 'success' | 'error' | 'skipped';
  data?: T;
  error?: string;
}

export interface BatchError {
  operationId: string;
  error: string;
  code?: string;
}

// Webhook Support
export interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  maxRetries: number;
  retryDelay: number; // seconds
  headers?: Record<string, string>;
}

export interface WebhookEvent {
  id: UUID;
  event: string;
  data: any;
  timestamp: Timestamp;
  signature: string;
}

export interface WebhookDelivery {
  id: UUID;
  webhookId: UUID;
  event: WebhookEvent;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastAttempt?: Timestamp;
  nextAttempt?: Timestamp;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
}

// API Versioning
export interface APIVersion {
  version: string;
  releaseDate: Timestamp;
  deprecationDate?: Timestamp;
  supportEndDate?: Timestamp;
  changes: string[];
  breakingChanges: string[];
  migrationGuide?: string;
}

// Request Context
export interface RequestContext {
  requestId: UUID;
  startTime: Timestamp;
  userAgent?: string;
  ipAddress?: string;
  referer?: string;
  country?: string;
  region?: string;
  city?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userId?: UUID;
  sessionId?: UUID;
  features?: string[]; // Feature flags enabled for this request
}

// API Analytics
export interface APIAnalytics {
  endpoint: string;
  method: HTTPMethod;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerHour: number[];
  errorRates: number[];
  statusCodeDistribution: Record<number, number>;
  topUserAgents: Array<{ userAgent: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  period: {
    start: Timestamp;
    end: Timestamp;
  };
}

// Error Handling
export interface APIError extends Error {
  code: string;
  statusCode: number;
  details?: any;
  timestamp: Timestamp;
  requestId?: UUID;
  userId?: UUID;
  cause?: Error;
}

export class ValidationErrorClass extends Error {
  constructor(
    public field: string,
    message: string,
    public code?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationErrorClass';
  }
}

export class AuthenticationError extends Error {
  code: string;
  statusCode: number;
  timestamp: Timestamp;
  details?: any;
  requestId?: UUID;
  userId?: UUID;
  cause?: Error;
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'AUTHENTICATION_REQUIRED';
    this.statusCode = 401;
    this.timestamp = new Date();
  }
}

export class AuthorizationError extends Error {
  code: string;
  statusCode: number;
  timestamp: Timestamp;
  details?: any;
  requestId?: UUID;
  userId?: UUID;
  cause?: Error;
  
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'INSUFFICIENT_PERMISSIONS';
    this.statusCode = 403;
    this.timestamp = new Date();
  }
}

export class NotFoundError extends Error {
  code: string;
  statusCode: number;
  timestamp: Timestamp;
  details?: any;
  requestId?: UUID;
  userId?: UUID;
  cause?: Error;
  
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.code = 'RESOURCE_NOT_FOUND';
    this.statusCode = 404;
    this.timestamp = new Date();
  }
}

export class ConflictError extends Error {
  code: string;
  statusCode: number;
  timestamp: Timestamp;
  details?: any;
  requestId?: UUID;
  userId?: UUID;
  cause?: Error;
  
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
    this.code = 'RESOURCE_CONFLICT';
    this.statusCode = 409;
    this.timestamp = new Date();
  }
}

export class RateLimitError extends Error {
  code: string;
  statusCode: number;
  timestamp: Timestamp;
  details?: any;
  requestId?: UUID;
  userId?: UUID;
  cause?: Error;
  public retryAfter?: number;
  
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT_EXCEEDED';
    this.statusCode = 429;
    this.timestamp = new Date();
    this.retryAfter = retryAfter;
  }
}

// Utility Types for API Development
export type ApiHandler<T = any> = (
  request: AuthenticatedRequest
) => Promise<SuccessResponse<T> | ErrorResponse>;

export type ProtectedApiHandler<T = any> = (
  request: AuthenticatedRequest & { user: User }
) => Promise<SuccessResponse<T> | ErrorResponse>;

export type AdminApiHandler<T = any> = (
  request: AuthenticatedRequest & { user: User & { role: 'ADMIN' | 'SUPER_ADMIN' } }
) => Promise<SuccessResponse<T> | ErrorResponse>;

// Type Guards
export function isSuccessResponse<T>(response: BaseResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: BaseResponse): response is ErrorResponse {
  return response.success === false;
}

export function hasValidationErrors(response: ErrorResponse): response is ErrorResponse & { details: ValidationError[] } {
  return Array.isArray(response.details) && response.details.length > 0;
}

// Note: Utility functions moved to top of file to avoid duplicates

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationResult<T>['pagination']
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination,
    timestamp: new Date()
  };
}

// Constants
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_CACHE_TTL = 300; // 5 minutes
export const MAX_BATCH_SIZE = 100;