// Prisma Helper Functions for TypeScript Compatibility
// This file provides utilities to handle Prisma CreateInput type requirements

import * as crypto from 'crypto';

/**
 * Generates required fields for Prisma CreateInput types
 * Many Prisma models require id and updatedAt fields that are auto-generated
 */
export function generatePrismaCreateFields() {
  return {
    id: crypto.randomUUID(),
    updatedAt: new Date(),
  };
}

/**
 * Helper for User creation with all required fields
 */
export function createUserData(data: {
  email: string;
  hashedPassword?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  privacySettings?: string;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    anonymousId: crypto.randomUUID(),
    ...data,
  };
}

/**
 * Helper for AuditLog creation with all required fields
 */
export function createAuditLogData(data: {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  outcome: string;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    ...data,
  };
}

/**
 * Helper for EmailVerification creation with all required fields
 */
export function createEmailVerificationData(data: {
  userId: string;
  token: string;
  email: string;
  expires: Date;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    ...data,
  };
}

/**
 * Helper for UserProfile creation with all required fields
 */
export function createUserProfileData(data: {
  userId: string;
  mentalHealthGoals?: string[];
  interestedTopics?: string[];
  preferredCommunication?: string[];
  crisisContacts?: string;
  notificationSettings?: string;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    ...data,
  };
}

/**
 * Helper for HelperProfile creation with all required fields
 */
export function createHelperProfileData(data: {
  userId: string;
  specializations?: string[];
  credentials?: string;
  experience?: string;
  approach?: string;
  languages?: string[];
  availability?: string;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    ...data,
  };
}

/**
 * Helper for AdminProfile creation with all required fields
 */
export function createAdminProfileData(data: {
  userId: string;
  adminLevel?: string;
  departments?: string[];
  permissions?: string;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    ...data,
  };
}

/**
 * Helper for PasswordReset creation with all required fields
 */
export function createPasswordResetData(data: {
  userId: string;
  token: string;
  expires: Date;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    ...data,
  };
}

/**
 * Helper for SafetyAlert creation with all required fields
 */
export function createSafetyAlertData(data: {
  type: string;
  severity: string;
  userId: string;
  context: string;
  indicators: string[];
  handled?: boolean;
  actions?: string[];
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    handled: false,
    actions: [],
    ...data,
  };
}

/**
 * Helper for ChatMessage creation with all required fields
 */
export function createChatMessageData(data: {
  roomId: string;
  authorId: string;
  content: string;
  type?: string;
  metadata?: any;
  reactions?: any[];
  flags?: any[];
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    type: 'text',
    reactions: [],
    flags: [],
    ...data,
  };
}

/**
 * Helper for ChatParticipant creation with all required fields
 */
export function createChatParticipantData(data: {
  roomId: string;
  userId: string;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    ...data,
  };
}

/**
 * Helper for AnonymousIdentity creation with all required fields
 */
export function createAnonymousIdentityData(data: {
  userId: string;
  displayName: string;
  avatar: string;
  colorTheme: string;
  languages: string[];
  badges?: any[];
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    badges: [],
    ...data,
  };
}

/**
 * Helper for TrustMetric creation with all required fields
 */
export function createTrustMetricData(data: {
  userId: string;
  score: number;
  level: string;
  factors: any;
  history: any[];
  restrictions?: string[];
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    restrictions: [],
    ...data,
  };
}

/**
 * Helper for Notification creation with all required fields
 */
export function createNotificationData(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  isPriority?: boolean;
  metadata?: any;
  [key: string]: any;
}) {
  return {
    ...generatePrismaCreateFields(),
    isPriority: false,
    ...data,
  };
}

/**
 * Generic helper for any Prisma model creation
 * Adds id and updatedAt fields to any data object
 */
export function withPrismaFields<T extends Record<string, any>>(data: T): T & { id: string; updatedAt: Date } {
  return {
    ...data,
    ...generatePrismaCreateFields(),
  };
}

/**
 * Helper to convert Zod issues to ValidationError format
 * Fixes the common issue where Zod issues don't match ValidationError interface
 */
export function convertZodIssuesToValidationErrors(issues: any[]): Array<{
  field: string;
  message: string;
  code?: string;
  value?: any;
}> {
  return issues.map(issue => ({
    field: issue.path?.join('.') || 'unknown',
    message: issue.message,
    code: issue.code,
    value: issue.received,
  }));
}