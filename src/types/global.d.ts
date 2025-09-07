// Global type declarations for packages without available types

declare module '@/lib/crisis-alert-system' {
  export class CrisisAlertSystem {
    static detectCrisis(content: string, userId: string): Promise<{
      detected: boolean;
      severity: number;
      indicators: string[];
      suggestedActions: string[];
    }>;
  }
}

declare module '@/lib/audit-logger' {
  export function auditLog(data: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: any;
    outcome: 'success' | 'failure';
  }): Promise<void>;
}

declare module '@/lib/websocket' {
  export function notifyCounselors(event: string, data: any): void;
  export function notifyUser(userId: string, event: string, data: any): void;
  export function emitCrisisAlert(alert: any): void;
  
  export const CrisisEvents: {
    ALERT_UPDATED: string;
    INTERVENTION_STARTED: string;
    INTERVENTION_COMPLETED: string;
  };
}

declare module '@/lib/community/moderation' {
  export function moderateContent(content: string, userId: string, type: string): Promise<{
    spamDetected: boolean;
    inappropriateContent: boolean;
    crisisDetected: boolean;
    crisisLevel?: string;
    reasons: string[];
    suggestedActions: string[];
    requiresReview: boolean;
  }>;
  
  export function sanitizeContent(content: string): string;
  export function checkContentRateLimit(userId: string, limit: number): boolean;
  export function detectCrisis(content: string): Promise<{
    detected: boolean;
    level: string;
    indicators: string[];
  }>;
  export function isUserRestricted(userId: string): Promise<boolean>;
  export function updateTrustScore(userId: string, type: string, delta: number): Promise<void>;
}

declare module '@/types/crisis' {
  export interface CreateSafetyPlanRequest {
    warningSignals: SafetyPlanSection;
    copingStrategies: SafetyPlanSection;
    supportContacts: Array<{
      name: string;
      relationship: string;
      phone: string;
      available: string;
    }>;
    safeEnvironment: SafetyPlanSection;
    reasonsToLive?: SafetyPlanSection;
    professionalContacts?: Array<{
      name: string;
      role: string;
      phone: string;
      email?: string;
    }>;
  }

  export interface UpdateSafetyPlanRequest {
    warningSignals?: SafetyPlanSection;
    copingStrategies?: SafetyPlanSection;
    supportContacts?: Array<{
      name: string;
      relationship: string;
      phone: string;
      available: string;
    }>;
    safeEnvironment?: SafetyPlanSection;
    reasonsToLive?: SafetyPlanSection;
    isActive?: boolean;
  }

  export interface SafetyPlanResponse {
    id: string;
    userId: string;
    isActive: boolean;
    lastReviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    warningSignals?: SafetyPlanSection;
    copingStrategies?: SafetyPlanSection;
    supportContacts?: any[];
    safeEnvironment?: SafetyPlanSection;
    reasonsToLive?: SafetyPlanSection;
  }

  export interface CrisisResponse<T = any> {
    success: boolean;
    data?: T;
    message: string;
    timestamp: Date;
  }

  export interface ValidationError {
    field: string;
    message: string;
  }

  export interface SafetyPlanSection {
    title: string;
    items: string[];
    notes?: string;
  }
}

declare module 'socket.io' {
  export interface Server {
    emit(event: string, data: any): void;
    to(room: string): {
      emit(event: string, data: any): void;
    };
  }
}

declare module 'ws' {
  export class WebSocket {
    constructor(url: string);
    send(data: string): void;
    on(event: string, callback: Function): void;
    close(): void;
  }
  
  export class WebSocketServer {
    constructor(options: any);
    on(event: string, callback: Function): void;
  }
}

// Extend existing modules
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: string;
  }
}

// Global crypto interface for Node.js
declare global {
  namespace NodeJS {
    interface Global {
      crypto: Crypto;
    }
  }
  
  const crypto: Crypto;
}

// Additional utility types
declare module '@/lib/encryption' {
  export function encryptJSON(data: any, key: string): string;
  export function decryptJSON(data: string, key: string): any;
  export function maskSensitiveData(data: string, type: string): string;
  export function encrypt(text: string, key: string): string;
  export function decrypt(encryptedText: string, key: string): string;
}

declare module '@/lib/auth-middleware' {
  import { NextRequest } from 'next/server';
  
  export interface AuthenticatedRequest extends NextRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
  }

  export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>): (req: NextRequest) => Promise<Response>;
  export function withRateLimit(requests: number, windowMs: number): (handler: any) => any;
  export function withCrisisCounselor(handler: (req: AuthenticatedRequest) => Promise<Response>): (req: NextRequest) => Promise<Response>;
  export function withAdmin(handler: (req: AuthenticatedRequest) => Promise<Response>): (req: NextRequest) => Promise<Response>;
}

declare module '@/lib/validation' {
  export interface ValidationResult {
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
    }>;
  }

  export function validateEmail(email: string): ValidationResult;
  export function validatePassword(password: string): ValidationResult;
  export function validatePhoneNumber(phone: string): ValidationResult;
}

// Fix for missing crypto import
declare module 'crypto' {
  export function randomUUID(): string;
  export function createHash(algorithm: string): {
    update(data: string): any;
    digest(encoding: string): string;
  };
  export function createCipher(algorithm: string, password: string): any;
  export function createDecipher(algorithm: string, password: string): any;
}