/**
 * Enhanced Validation Schemas for AstralCore Mental Health Platform
 * 
 * This module extends the existing validation schemas with:
 * - XSS prevention integration
 * - Enhanced security validation
 * - HIPAA-compliant data handling
 * - Comprehensive input sanitization
 * - Medical data specific validations
 * 
 * @author AstralCore Development Team
 * @version 1.0.0
 */

import { z } from 'zod';
import ValidationService from './validation-service';
import type { UUID, Email, PhoneNumber } from '@/types';

// Get validation service instance
const validator = ValidationService.getInstance();

// ==================== ENHANCED BASE SCHEMAS ====================

/**
 * Secure string schema with XSS prevention
 */
const createSecureString = (options: {
  min?: number;
  max?: number;
  type?: 'text' | 'html' | 'url' | 'email' | 'phone' | 'filepath';
  medical?: boolean;
  required?: boolean;
} = {}) => {
  const { min = 1, max = 1000, type = 'text', medical = false, required = true } = options;
  
  let schema = z.string();
  
  if (!required) {
    schema = schema.optional();
  }
  
  return schema
    .transform((val) => {
      if (!val) return val;
      const result = validator.validateSecurity(val, type);
      if (!result.isSecure) {
        throw new z.ZodError([{
          code: 'custom',
          message: `Security validation failed: ${result.threats.join(', ')}`,
          path: []
        }]);
      }
      return result.sanitized;
    })
    .refine((val) => {
      if (!val) return true;
      if (medical) {
        const medicalCheck = validator.validateMedicalText(val);
        return medicalCheck.isValid;
      }
      return true;
    }, 'Text contains invalid characters for medical documentation')
    .refine((val) => {
      if (!val) return true;
      const lengthCheck = validator.validateLength(val, max);
      return lengthCheck.isValid;
    }, `Text exceeds maximum length of ${max} characters`)
    .refine((val) => {
      if (!val) return true;
      return val.length >= min;
    }, `Text must be at least ${min} characters`);
};

/**
 * Secure email schema with comprehensive validation
 */
const secureEmail = z.string()
  .email('Must be a valid email address')
  .transform((email) => validator.sanitizeEmail(email))
  .refine((email) => {
    const result = validator.validateSecurity(email, 'email');
    return result.isSecure;
  }, 'Email contains potentially dangerous content')
  .refine((email) => email.length <= 254, 'Email exceeds maximum length');

/**
 * Secure phone number schema
 */
const securePhoneNumber = z.string()
  .transform((phone) => validator.sanitizePhoneNumber(phone))
  .refine((phone) => {
    const result = validator.validateSecurity(phone, 'phone');
    return result.isSecure;
  }, 'Phone number contains invalid characters')
  .refine((phone) => /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s\-\(\)\.]/g, '')), 'Must be a valid phone number');

/**
 * Secure URL schema with protocol validation
 */
const secureURL = z.string()
  .url('Must be a valid URL')
  .transform((url) => validator.sanitizeURL(url, ['http', 'https']))
  .refine((url) => url !== '', 'URL protocol not allowed or URL is malformed')
  .refine((url) => {
    const result = validator.validateSecurity(url, 'url');
    return result.isSecure;
  }, 'URL contains potentially dangerous content');

/**
 * Secure file path schema
 */
const secureFilePath = z.string()
  .transform((path) => validator.sanitizeFilePath(path))
  .refine((path) => {
    const result = validator.validateSecurity(path, 'filepath');
    return result.isSecure;
  }, 'File path contains potentially dangerous content')
  .refine((path) => path.length > 0, 'File path cannot be empty after sanitization');

// ==================== USER VALIDATION SCHEMAS ====================

export const EnhancedUserSchemas = {
  /**
   * Enhanced user registration with security validation
   */
  registration: z.object({
    email: secureEmail,
    password: z.string()
      .min(12, 'Password must be at least 12 characters for enhanced security')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, 
        'Password must contain uppercase, lowercase, number, and special character')
      .refine((password) => {
        // Check against common passwords (basic implementation)
        const commonPasswords = ['password123', 'Password123!', '123456789', 'qwerty123'];
        return !commonPasswords.includes(password.toLowerCase());
      }, 'Password is too common')
      .transform((password) => {
        const result = validator.validateSecurity(password, 'text');
        if (!result.isSecure) {
          throw new z.ZodError([{
            code: 'custom',
            message: 'Password contains potentially dangerous characters',
            path: []
          }]);
        }
        return password; // Don't sanitize passwords, just validate
      }),
    confirmPassword: z.string(),
    firstName: createSecureString({ min: 2, max: 50, medical: true }),
    lastName: createSecureString({ min: 2, max: 50, medical: true }),
    displayName: createSecureString({ min: 2, max: 100, required: false }),
    phoneNumber: securePhoneNumber.optional(),
    acceptedTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions'),
    acceptedPrivacy: z.boolean().refine(val => val === true, 'Must accept privacy policy'),
    acceptedHipaa: z.boolean().refine(val => val === true, 'Must acknowledge HIPAA notice'),
    marketingConsent: z.boolean().optional().default(false),
    emergencyContact: z.object({
      name: createSecureString({ min: 2, max: 100, medical: true }),
      relationship: createSecureString({ min: 2, max: 50, medical: true }),
      phoneNumber: securePhoneNumber
    }).optional(),
    medicalHistory: z.object({
      hasMentalHealthHistory: z.boolean(),
      currentMedications: createSecureString({ max: 2000, medical: true, required: false }),
      allergies: createSecureString({ max: 1000, medical: true, required: false }),
      emergencyMedicalInfo: createSecureString({ max: 1000, medical: true, required: false })
    }).optional()
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  /**
   * Enhanced profile update schema
   */
  profileUpdate: z.object({
    firstName: createSecureString({ min: 2, max: 50, medical: true, required: false }),
    lastName: createSecureString({ min: 2, max: 50, medical: true, required: false }),
    displayName: createSecureString({ min: 2, max: 100, required: false }),
    bio: createSecureString({ max: 500, medical: true, required: false }),
    phoneNumber: securePhoneNumber.optional(),
    timezone: z.string().max(50).optional(),
    locale: z.string().max(10).optional(),
    profilePicture: secureURL.optional(),
    preferences: z.object({
      language: z.string().max(10).optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      notifications: z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        push: z.boolean().optional(),
        crisisAlerts: z.boolean().default(true)
      }).optional(),
      privacy: z.object({
        shareProgress: z.boolean().default(false),
        allowMessaging: z.boolean().default(true),
        showOnlineStatus: z.boolean().default(false)
      }).optional()
    }).optional()
  })
};

// ==================== AUTHENTICATION SCHEMAS ====================

export const EnhancedAuthSchemas = {
  /**
   * Secure login schema
   */
  login: z.object({
    email: secureEmail,
    password: z.string()
      .min(1, 'Password is required')
      .transform((password) => {
        const result = validator.validateSecurity(password, 'text');
        if (!result.isSecure) {
          throw new z.ZodError([{
            code: 'custom',
            message: 'Invalid login attempt',
            path: []
          }]);
        }
        return password;
      }),
    rememberMe: z.boolean().optional().default(false),
    mfaCode: z.string()
      .regex(/^\d{6}$/, 'MFA code must be 6 digits')
      .optional(),
    deviceFingerprint: z.string().max(500).optional(),
    captchaToken: z.string().max(1000).optional()
  }),

  /**
   * Password reset with enhanced security
   */
  passwordReset: z.object({
    email: secureEmail,
    captchaToken: z.string().min(1, 'Captcha is required').max(1000)
  }),

  /**
   * Two-factor authentication setup
   */
  twoFactorSetup: z.object({
    secret: z.string().min(16).max(32),
    backupCodes: z.array(z.string().length(8)).length(8),
    deviceName: createSecureString({ min: 1, max: 50 })
  })
};

// ==================== WELLNESS & MENTAL HEALTH SCHEMAS ====================

export const EnhancedWellnessSchemas = {
  /**
   * Mood tracking with medical validation
   */
  moodEntry: z.object({
    date: z.date(),
    mood: z.number().int().min(1).max(10),
    energy: z.number().int().min(1).max(10),
    anxiety: z.number().int().min(1).max(10),
    depression: z.number().int().min(1).max(10),
    notes: createSecureString({ max: 2000, medical: true, required: false }),
    triggers: z.array(createSecureString({ max: 100, medical: true })).max(10).optional(),
    copingStrategies: z.array(createSecureString({ max: 100, medical: true })).max(10).optional(),
    medications: z.array(z.object({
      name: createSecureString({ min: 1, max: 100, medical: true }),
      dosage: createSecureString({ min: 1, max: 50, medical: true }),
      timesTaken: z.number().int().min(0).max(10),
      sideEffects: createSecureString({ max: 500, medical: true, required: false })
    })).max(20).optional(),
    sleepHours: z.number().min(0).max(24).optional(),
    exerciseMinutes: z.number().int().min(0).max(1440).optional(),
    socialInteraction: z.number().int().min(1).max(10).optional()
  }),

  /**
   * Journal entry with comprehensive validation
   */
  journalEntry: z.object({
    title: createSecureString({ min: 1, max: 200, medical: true }),
    content: createSecureString({ min: 10, max: 10000, medical: true }),
    mood: z.number().int().min(1).max(10),
    isPrivate: z.boolean().default(true),
    tags: z.array(createSecureString({ min: 1, max: 30, medical: true })).max(10).optional(),
    gratitude: z.array(createSecureString({ max: 200, medical: true })).max(5).optional(),
    goals: z.array(createSecureString({ max: 200, medical: true })).max(5).optional(),
    reflections: createSecureString({ max: 1000, medical: true, required: false }),
    attachments: z.array(z.object({
      type: z.enum(['image', 'audio', 'document']),
      url: secureURL,
      description: createSecureString({ max: 200, required: false })
    })).max(5).optional()
  }),

  /**
   * Goal setting and tracking
   */
  wellnessGoal: z.object({
    title: createSecureString({ min: 1, max: 200, medical: true }),
    description: createSecureString({ min: 10, max: 1000, medical: true }),
    category: z.enum(['mental_health', 'physical_health', 'social', 'professional', 'personal']),
    priority: z.enum(['low', 'medium', 'high']),
    targetDate: z.date().refine(date => date > new Date(), 'Target date must be in the future'),
    measurable: z.boolean().default(false),
    metrics: z.array(z.object({
      name: createSecureString({ min: 1, max: 100, medical: true }),
      unit: createSecureString({ min: 1, max: 20, medical: true }),
      targetValue: z.number(),
      currentValue: z.number().default(0)
    })).max(5).optional(),
    milestones: z.array(z.object({
      title: createSecureString({ min: 1, max: 100, medical: true }),
      description: createSecureString({ max: 500, medical: true }),
      dueDate: z.date(),
      isCompleted: z.boolean().default(false)
    })).max(10).optional()
  })
};

// ==================== CRISIS INTERVENTION SCHEMAS ====================

export const EnhancedCrisisSchemas = {
  /**
   * Crisis report with enhanced security
   */
  crisisReport: z.object({
    type: z.enum([
      'suicide_ideation', 'self_harm', 'substance_abuse', 'domestic_violence', 
      'mental_health_emergency', 'panic_attack', 'psychotic_episode', 
      'eating_disorder', 'trauma_response', 'other'
    ]),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    urgency: z.enum(['immediate', 'urgent', 'standard', 'routine']),
    description: createSecureString({ min: 20, max: 2000, medical: true }),
    symptoms: z.array(createSecureString({ max: 100, medical: true })).min(1).max(15),
    duration: createSecureString({ max: 100, medical: true, required: false }),
    triggers: z.array(createSecureString({ max: 100, medical: true })).max(10).optional(),
    currentLocation: z.object({
      isSafe: z.boolean(),
      type: z.enum(['home', 'work', 'school', 'public', 'healthcare', 'other']),
      hasSupport: z.boolean(),
      description: createSecureString({ max: 200, medical: true, required: false })
    }),
    riskAssessment: z.object({
      suicidalIdeation: z.boolean(),
      selfHarmIntent: z.boolean(),
      homicidalIdeation: z.boolean(),
      substanceUse: z.boolean(),
      psychosis: z.boolean(),
      cognitiveImpairment: z.boolean(),
      accessToMeans: z.boolean(),
      previousAttempts: z.boolean(),
      socialSupport: z.enum(['none', 'limited', 'moderate', 'strong']),
      copingAbility: z.enum(['none', 'poor', 'fair', 'good'])
    }),
    contactInfo: z.object({
      preferredMethod: z.enum(['phone', 'text', 'chat', 'video', 'in_person']),
      alternateContacts: z.array(z.object({
        name: createSecureString({ min: 1, max: 100, medical: true }),
        relationship: createSecureString({ min: 1, max: 50, medical: true }),
        phoneNumber: securePhoneNumber,
        canContact: z.boolean().default(false)
      })).max(3).optional()
    }),
    previousInterventions: z.array(z.object({
      type: createSecureString({ max: 100, medical: true }),
      date: z.date(),
      effective: z.boolean(),
      notes: createSecureString({ max: 500, medical: true, required: false })
    })).max(5).optional(),
    isAnonymous: z.boolean().default(false)
  }),

  /**
   * Safety plan creation/update
   */
  safetyPlan: z.object({
    personalWarningSigns: z.array(createSecureString({ max: 200, medical: true })).min(1).max(10),
    internalCopingStrategies: z.array(createSecureString({ max: 200, medical: true })).min(1).max(10),
    socialSupports: z.array(z.object({
      name: createSecureString({ min: 1, max: 100, medical: true }),
      relationship: createSecureString({ min: 1, max: 50, medical: true }),
      phoneNumber: securePhoneNumber,
      availability: createSecureString({ max: 100, medical: true }),
      role: z.enum(['distraction', 'emotional_support', 'practical_help', 'means_removal']),
      notes: createSecureString({ max: 200, medical: true, required: false })
    })).min(1).max(10),
    professionalContacts: z.array(z.object({
      name: createSecureString({ min: 1, max: 100, medical: true }),
      title: createSecureString({ min: 1, max: 100, medical: true }),
      organization: createSecureString({ min: 1, max: 200, medical: true }),
      phoneNumber: securePhoneNumber,
      type: z.enum(['therapist', 'psychiatrist', 'crisis_counselor', 'case_manager', 'primary_care', 'emergency']),
      availability: createSecureString({ min: 1, max: 100, medical: true }),
      notes: createSecureString({ max: 200, medical: true, required: false })
    })).min(1).max(10),
    environmentalSafety: z.object({
      meansRestriction: z.array(createSecureString({ max: 200, medical: true })).max(10),
      safePlaces: z.array(z.object({
        location: createSecureString({ max: 100, medical: true }),
        contactPerson: createSecureString({ max: 100, medical: true, required: false }),
        phoneNumber: securePhoneNumber.optional(),
        notes: createSecureString({ max: 200, medical: true, required: false })
      })).max(5),
      avoidPlaces: z.array(createSecureString({ max: 100, medical: true })).max(5).optional()
    }),
    reasonsForLiving: z.array(createSecureString({ max: 200, medical: true })).min(1).max(10),
    copingStrategiesDetailed: z.array(z.object({
      strategy: createSecureString({ max: 100, medical: true }),
      description: createSecureString({ max: 500, medical: true }),
      effectiveness: z.number().int().min(1).max(10),
      requirements: createSecureString({ max: 200, medical: true, required: false })
    })).max(15)
  })
};

// ==================== COMMUNITY & MESSAGING SCHEMAS ====================

export const EnhancedCommunitySchemas = {
  /**
   * Community post with content moderation
   */
  communityPost: z.object({
    title: createSecureString({ min: 5, max: 200 }),
    content: createSecureString({ min: 10, max: 5000, type: 'html' }),
    category: z.enum([
      'general', 'support', 'recovery', 'therapy', 'medication', 
      'anxiety', 'depression', 'bipolar', 'ptsd', 'eating_disorders',
      'addiction', 'relationships', 'work_stress', 'peer_support'
    ]),
    tags: z.array(createSecureString({ min: 1, max: 30 })).max(10).optional(),
    isAnonymous: z.boolean().default(false),
    allowComments: z.boolean().default(true),
    triggerWarning: z.boolean().default(false),
    triggerWarningContent: createSecureString({ max: 200, required: false }),
    attachments: z.array(z.object({
      type: z.enum(['image', 'document']),
      url: secureURL,
      description: createSecureString({ max: 200, required: false })
    })).max(3).optional()
  }),

  /**
   * Comment with enhanced moderation
   */
  communityComment: z.object({
    postId: z.string().uuid(),
    parentCommentId: z.string().uuid().optional(),
    content: createSecureString({ min: 1, max: 1000, type: 'html' }),
    isAnonymous: z.boolean().default(false),
    supportiveVote: z.boolean().optional()
  }),

  /**
   * Direct message with encryption support
   */
  directMessage: z.object({
    recipientId: z.string().uuid(),
    conversationId: z.string().uuid().optional(),
    content: createSecureString({ min: 1, max: 2000 }),
    type: z.enum(['text', 'image', 'file', 'voice', 'crisis_alert']).default('text'),
    priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
    encrypted: z.boolean().default(true),
    attachments: z.array(z.object({
      type: z.enum(['image', 'document', 'audio']),
      url: secureURL,
      encrypted: z.boolean().default(true),
      description: createSecureString({ max: 200, required: false })
    })).max(3).optional(),
    expiresAt: z.date().optional()
  })
};

// ==================== FILE UPLOAD SCHEMAS ====================

export const EnhancedFileSchemas = {
  /**
   * Secure file upload with comprehensive validation
   */
  fileUpload: z.object({
    fileName: createSecureString({ min: 1, max: 255, type: 'filepath' }),
    fileSize: z.number().int().min(1).max(100 * 1024 * 1024), // 100MB max
    mimeType: z.enum([
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm'
    ]),
    purpose: z.enum([
      'profile_picture', 'journal_attachment', 'therapy_document',
      'crisis_evidence', 'community_image', 'medical_record',
      'identification', 'insurance_card'
    ]),
    isEncrypted: z.boolean().default(true),
    scanForMalware: z.boolean().default(true),
    metadata: z.object({
      description: createSecureString({ max: 500, required: false }),
      tags: z.array(createSecureString({ max: 30 })).max(10).optional(),
      isPhiData: z.boolean().default(false), // Protected Health Information
      retentionPeriod: z.number().int().min(1).max(3650).optional() // Days
    }).optional()
  })
};

// ==================== SEARCH & QUERY SCHEMAS ====================

export const EnhancedSearchSchemas = {
  /**
   * Secure search query with injection prevention
   */
  searchQuery: z.object({
    query: createSecureString({ min: 1, max: 200 })
      .refine((query) => {
        // Additional search-specific validations
        const sqlCheck = validator.detectSQLInjection(query);
        return sqlCheck.isSafe;
      }, 'Search query contains potentially dangerous content'),
    category: z.enum([
      'all', 'users', 'posts', 'resources', 'therapy_sessions',
      'journal_entries', 'crisis_reports', 'wellness_goals'
    ]).optional().default('all'),
    filters: z.object({
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      tags: z.array(createSecureString({ max: 30 })).max(10).optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      status: z.string().max(50).optional()
    }).optional(),
    pagination: z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
      sortBy: z.string().max(50).optional(),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    }).optional()
  })
};

// ==================== EXPORT ALL SCHEMAS ====================

export const SecureSchemas = {
  User: EnhancedUserSchemas,
  Auth: EnhancedAuthSchemas,
  Wellness: EnhancedWellnessSchemas,
  Crisis: EnhancedCrisisSchemas,
  Community: EnhancedCommunitySchemas,
  File: EnhancedFileSchemas,
  Search: EnhancedSearchSchemas
};

// Export individual schema collections
export {
  EnhancedUserSchemas,
  EnhancedAuthSchemas,
  EnhancedWellnessSchemas,
  EnhancedCrisisSchemas,
  EnhancedCommunitySchemas,
  EnhancedFileSchemas,
  EnhancedSearchSchemas
};

// Export utility functions for custom validations
export const ValidationUtils = {
  createSecureString,
  secureEmail,
  securePhoneNumber,
  secureURL,
  secureFilePath
};

export default SecureSchemas;