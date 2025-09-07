import { faker } from '@faker-js/faker'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

/**
 * Factory interface for creating test objects
 */
interface Factory<T> {
  create(overrides?: Partial<T>): T
  createMany(count: number, overrides?: Partial<T>): T[]
}

/**
 * Base factory class
 */
abstract class BaseFactory<T> implements Factory<T> {
  abstract build(overrides?: Partial<T>): T

  create(overrides?: Partial<T>): T {
    return this.build(overrides)
  }

  createMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }
}

/**
 * User factory for creating test users
 */
export class UserFactory extends BaseFactory<any> {
  build(overrides: Partial<any> = {}): any {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet.email(firstName, lastName).toLowerCase()

    return {
      id: randomUUID(),
      anonymousId: randomUUID(),
      email,
      hashedPassword: bcrypt.hashSync('password123', 12),
      role: UserRole.USER,
      isActive: true,
      isEmailVerified: faker.datatype.boolean(0.8),
      isTwoFactorEnabled: false,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      avatarUrl: faker.image.avatar(),
      phoneNumber: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      timezone: faker.location.timeZone(),
      preferredLanguage: 'en',
      privacySettings: JSON.stringify({
        shareProfile: faker.datatype.boolean(),
        allowDirectMessages: faker.datatype.boolean(0.8),
        showOnlineStatus: faker.datatype.boolean(0.3),
      }),
      lastLoginAt: faker.date.recent({ days: 7 }),
      lastActiveAt: faker.date.recent({ days: 1 }),
      failedLoginAttempts: 0,
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: new Date(),
      ...overrides,
    }
  }

  /**
   * Create a user with specific role
   */
  withRole(role: UserRole, overrides: Partial<any> = {}): any {
    return this.build({ role, ...overrides })
  }

  /**
   * Create an inactive user
   */
  inactive(overrides: Partial<any> = {}): any {
    return this.build({ 
      isActive: false, 
      lastActiveAt: faker.date.past({ years: 1 }),
      ...overrides 
    })
  }

  /**
   * Create a user with unverified email
   */
  unverifiedEmail(overrides: Partial<any> = {}): any {
    return this.build({ isEmailVerified: false, ...overrides })
  }

  /**
   * Create a locked user account
   */
  locked(overrides: Partial<any> = {}): any {
    return this.build({
      failedLoginAttempts: 5,
      lockedUntil: faker.date.future({ }),
      ...overrides,
    })
  }
}

/**
 * Session factory for creating test sessions
 */
export class SessionFactory extends BaseFactory<any> {
  build(overrides: Partial<any> = {}): any {
    return {
      id: randomUUID(),
      sessionToken: randomUUID(),
      userId: randomUUID(),
      expires: faker.date.future({ }),
      ...overrides,
    }
  }

  /**
   * Create an expired session
   */
  expired(overrides: Partial<any> = {}): any {
    return this.build({
      expires: faker.date.past({ }),
      ...overrides,
    })
  }
}

/**
 * UserProfile factory for creating test user profiles
 */
export class UserProfileFactory extends BaseFactory<any> {
  build(overrides: Partial<any> = {}): any {
    return {
      id: randomUUID(),
      userId: randomUUID(),
      mentalHealthGoals: faker.helpers.arrayElements([
        'anxiety_management',
        'depression_support',
        'stress_reduction',
        'sleep_improvement',
        'mood_tracking',
      ], { min: 1, max: 3 }),
      interestedTopics: faker.helpers.arrayElements([
        'mindfulness',
        'cognitive_therapy',
        'peer_support',
        'crisis_support',
        'wellness_tracking',
      ], { min: 1, max: 4 }),
      preferredCommunication: faker.helpers.arrayElements([
        'chat',
        'video',
        'voice',
        'email',
      ], { min: 1, max: 2 }),
      crisisContacts: JSON.stringify([
        {
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          relationship: faker.helpers.arrayElement(['family', 'friend', 'therapist']),
        },
      ]),
      notificationSettings: JSON.stringify({
        email: faker.datatype.boolean(0.8),
        push: faker.datatype.boolean(0.9),
        crisis: true,
        appointments: faker.datatype.boolean(0.95),
        wellness: faker.datatype.boolean(0.7),
      }),
      privacyLevel: faker.helpers.arrayElement(['low', 'moderate', 'high']),
      shareDataForResearch: faker.datatype.boolean(0.3),
      onboardingCompleted: faker.datatype.boolean(0.8),
      wellnessScore: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
      lastAssessmentAt: faker.date.recent({ days: 14 }),
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: new Date(),
      ...overrides,
    }
  }

  /**
   * Create a completed onboarding profile
   */
  onboardingCompleted(overrides: Partial<any> = {}): any {
    return this.build({
      onboardingCompleted: true,
      wellnessScore: faker.number.float({ min: 50, max: 90, fractionDigits: 1 }),
      ...overrides,
    })
  }
}

/**
 * MoodEntry factory for creating test mood entries
 */
export class MoodEntryFactory extends BaseFactory<any> {
  build(overrides: Partial<any> = {}): any {
    return {
      id: randomUUID(),
      userId: randomUUID(),
      moodScore: faker.number.int({ min: 1, max: 10 }),
      anxietyLevel: faker.number.int({ min: 1, max: 10 }),
      energyLevel: faker.number.int({ min: 1, max: 10 }),
      encryptedNotes: JSON.stringify({
        notes: faker.lorem.paragraph(),
        triggers: faker.helpers.arrayElements([
          'work_stress',
          'relationships',
          'health',
          'finances',
          'sleep',
        ], { min: 0, max: 2 }),
      }),
      encryptedTags: JSON.stringify([
        faker.helpers.arrayElement(['good', 'okay', 'difficult', 'great', 'struggling']),
      ]),
      createdAt: faker.date.recent({ days: 7 }),
      ...overrides,
    }
  }

  /**
   * Create a positive mood entry
   */
  positive(overrides: Partial<any> = {}): any {
    return this.build({
      moodScore: faker.number.int({ min: 7, max: 10 }),
      anxietyLevel: faker.number.int({ min: 1, max: 4 }),
      energyLevel: faker.number.int({ min: 6, max: 10 }),
      ...overrides,
    })
  }

  /**
   * Create a concerning mood entry
   */
  concerning(overrides: Partial<any> = {}): any {
    return this.build({
      moodScore: faker.number.int({ min: 1, max: 3 }),
      anxietyLevel: faker.number.int({ min: 7, max: 10 }),
      energyLevel: faker.number.int({ min: 1, max: 3 }),
      ...overrides,
    })
  }
}

/**
 * JournalEntry factory for creating test journal entries
 */
export class JournalEntryFactory extends BaseFactory<any> {
  build(overrides: Partial<any> = {}): any {
    return {
      id: randomUUID(),
      userId: randomUUID(),
      encryptedTitle: faker.lorem.sentence(3),
      encryptedContent: faker.lorem.paragraphs(2),
      encryptedTags: JSON.stringify([
        faker.helpers.arrayElements([
          'therapy',
          'self_care',
          'goals',
          'gratitude',
          'reflection',
          'progress',
        ], { min: 1, max: 3 }),
      ]),
      isPrivate: faker.datatype.boolean(0.9),
      sentiment: faker.number.float({ min: -1, max: 1, fractionDigits: 2 }),
      createdAt: faker.date.recent({ days: 14 }),
      updatedAt: new Date(),
      ...overrides,
    }
  }
}

/**
 * CrisisReport factory for creating test crisis reports
 */
export class CrisisReportFactory extends BaseFactory<any> {
  build(overrides: Partial<any> = {}): any {
    return {
      id: randomUUID(),
      userId: randomUUID(),
      severityLevel: faker.number.int({ min: 1, max: 5 }),
      triggerType: faker.helpers.arrayElement([
        'suicidal_ideation',
        'self_harm',
        'panic_attack',
        'psychotic_episode',
        'substance_abuse',
      ]),
      interventionType: faker.helpers.arrayElement([
        'peer_support',
        'professional_referral',
        'emergency_services',
        'safety_plan_activation',
        'follow_up_contact',
      ]),
      encryptedDetails: JSON.stringify({
        description: faker.lorem.paragraph(),
        context: faker.lorem.sentence(),
        supportProvided: faker.lorem.sentence(),
      }),
      responseTime: faker.number.int({ min: 1, max: 30 }), // minutes
      resolved: faker.datatype.boolean(0.7),
      resolvedAt: faker.datatype.boolean(0.7) ? faker.date.recent({ days: 1 }) : null,
      emergencyContactUsed: faker.datatype.boolean(0.3),
      createdAt: faker.date.recent({ days: 7 }),
      updatedAt: new Date(),
      ...overrides,
    }
  }

  /**
   * Create a high severity crisis report
   */
  highSeverity(overrides: Partial<any> = {}): any {
    return this.build({
      severityLevel: faker.number.int({ min: 4, max: 5 }),
      emergencyContactUsed: faker.datatype.boolean(0.8),
      responseTime: faker.number.int({ min: 1, max: 5 }),
      ...overrides,
    })
  }

  /**
   * Create an unresolved crisis report
   */
  unresolved(overrides: Partial<any> = {}): any {
    return this.build({
      resolved: false,
      resolvedAt: null,
      ...overrides,
    })
  }
}

/**
 * AuditLog factory for creating test audit logs
 */
export class AuditLogFactory extends BaseFactory<any> {
  build(overrides: Partial<any> = {}): any {
    return {
      id: randomUUID(),
      userId: randomUUID(),
      action: faker.helpers.arrayElement([
        'login_success',
        'login_failed',
        'password_change',
        'profile_update',
        'data_export',
        'crisis_report_created',
      ]),
      resource: faker.helpers.arrayElement([
        'auth',
        'user',
        'crisis',
        'journal',
        'mood',
        'admin',
      ]),
      resourceId: faker.datatype.boolean(0.5) ? randomUUID() : null,
      details: JSON.stringify({
        ip: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        additionalInfo: faker.lorem.sentence(),
      }),
      outcome: faker.helpers.arrayElement(['success', 'failure', 'partial']),
      timestamp: faker.date.recent({ days: 30 }),
      ...overrides,
    }
  }

  /**
   * Create a security-related audit log
   */
  security(overrides: Partial<any> = {}): any {
    return this.build({
      action: faker.helpers.arrayElement([
        'login_failed',
        'account_locked',
        'suspicious_activity',
        'unauthorized_access_attempt',
      ]),
      resource: 'auth',
      outcome: 'failure',
      ...overrides,
    })
  }
}

// Export factory instances
export const userFactory = new UserFactory()
export const sessionFactory = new SessionFactory()
export const userProfileFactory = new UserProfileFactory()
export const moodEntryFactory = new MoodEntryFactory()
export const journalEntryFactory = new JournalEntryFactory()
export const crisisReportFactory = new CrisisReportFactory()
export const auditLogFactory = new AuditLogFactory()

/**
 * Factory registry for easy access
 */
export const factories = {
  user: userFactory,
  session: sessionFactory,
  userProfile: userProfileFactory,
  moodEntry: moodEntryFactory,
  journalEntry: journalEntryFactory,
  crisisReport: crisisReportFactory,
  auditLog: auditLogFactory,
}