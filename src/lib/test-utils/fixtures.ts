import { UserRole } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * Common test fixtures for consistent test data
 */

// User fixtures
export const testUsers = {
  regularUser: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    anonymousId: '550e8400-e29b-41d4-a716-446655440001',
    email: 'user@test.com',
    hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBaG0Nz4Ew4RYaS', // password123
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: true,
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date(),
  },
  
  helperUser: {
    id: '550e8400-e29b-41d4-a716-446655440010',
    anonymousId: '550e8400-e29b-41d4-a716-446655440011',
    email: 'helper@test.com',
    hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBaG0Nz4Ew4RYaS',
    role: UserRole.HELPER,
    isActive: true,
    isEmailVerified: true,
    firstName: 'Test',
    lastName: 'Helper',
    displayName: 'Test Helper',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date(),
  },

  therapistUser: {
    id: '550e8400-e29b-41d4-a716-446655440020',
    anonymousId: '550e8400-e29b-41d4-a716-446655440021',
    email: 'therapist@test.com',
    hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBaG0Nz4Ew4RYaS',
    role: UserRole.THERAPIST,
    isActive: true,
    isEmailVerified: true,
    firstName: 'Test',
    lastName: 'Therapist',
    displayName: 'Dr. Test Therapist',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date(),
  },

  crisisCounselorUser: {
    id: '550e8400-e29b-41d4-a716-446655440030',
    anonymousId: '550e8400-e29b-41d4-a716-446655440031',
    email: 'crisis@test.com',
    hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBaG0Nz4Ew4RYaS',
    role: UserRole.CRISIS_COUNSELOR,
    isActive: true,
    isEmailVerified: true,
    firstName: 'Test',
    lastName: 'Counselor',
    displayName: 'Test Crisis Counselor',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date(),
  },

  adminUser: {
    id: '550e8400-e29b-41d4-a716-446655440040',
    anonymousId: '550e8400-e29b-41d4-a716-446655440041',
    email: 'admin@test.com',
    hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBaG0Nz4Ew4RYaS',
    role: UserRole.ADMIN,
    isActive: true,
    isEmailVerified: true,
    firstName: 'Test',
    lastName: 'Admin',
    displayName: 'Test Admin',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date(),
  },

  inactiveUser: {
    id: '550e8400-e29b-41d4-a716-446655440050',
    anonymousId: '550e8400-e29b-41d4-a716-446655440051',
    email: 'inactive@test.com',
    hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBaG0Nz4Ew4RYaS',
    role: UserRole.USER,
    isActive: false,
    isEmailVerified: true,
    firstName: 'Inactive',
    lastName: 'User',
    displayName: 'Inactive User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date('2024-01-01T00:00:00Z'),
  },

  unverifiedUser: {
    id: '550e8400-e29b-41d4-a716-446655440060',
    anonymousId: '550e8400-e29b-41d4-a716-446655440061',
    email: 'unverified@test.com',
    hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBaG0Nz4Ew4RYaS',
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: false,
    firstName: 'Unverified',
    lastName: 'User',
    displayName: 'Unverified User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date(),
  },
}

// Session fixtures
export const testSessions = {
  validSession: {
    id: '660e8400-e29b-41d4-a716-446655440000',
    sessionToken: 'valid-session-token-12345',
    userId: testUsers.regularUser.id,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },

  expiredSession: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    sessionToken: 'expired-session-token-12345',
    userId: testUsers.regularUser.id,
    expires: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
}

// Authentication fixtures
export const authFixtures = {
  validCredentials: {
    email: testUsers.regularUser.email,
    password: 'password123',
  },

  invalidCredentials: {
    email: 'nonexistent@test.com',
    password: 'wrongpassword',
  },

  validRegisterData: {
    email: 'newuser@test.com',
    password: 'newpassword123',
    firstName: 'New',
    lastName: 'User',
  },

  invalidRegisterData: {
    email: 'invalid-email',
    password: '123', // too short
    firstName: '',
    lastName: '',
  },
}

// API request fixtures
export const apiFixtures = {
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'test-agent',
  },

  authHeaders: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token',
  },

  formHeaders: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
}

// Error fixtures
export const errorFixtures = {
  validationError: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password too short' },
    ],
  },

  authenticationError: {
    message: 'Invalid credentials',
    code: 'AUTHENTICATION_FAILED',
  },

  authorizationError: {
    message: 'Insufficient permissions',
    code: 'AUTHORIZATION_FAILED',
  },

  notFoundError: {
    message: 'Resource not found',
    code: 'NOT_FOUND',
  },

  serverError: {
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  },
}

// Mock data for external services
export const mockData = {
  // Mock NextAuth session
  nextAuthSession: {
    user: {
      id: testUsers.regularUser.id,
      email: testUsers.regularUser.email,
      name: testUsers.regularUser.displayName,
      role: testUsers.regularUser.role,
      isEmailVerified: testUsers.regularUser.isEmailVerified,
      onboardingCompleted: true,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // Mock JWT token
  jwtToken: {
    sub: testUsers.regularUser.id,
    email: testUsers.regularUser.email,
    role: testUsers.regularUser.role,
    isEmailVerified: testUsers.regularUser.isEmailVerified,
    onboardingCompleted: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
  },

  // Mock encrypted data
  encryptedData: {
    encryptedText: 'encrypted-content-placeholder',
    iv: 'initialization-vector',
    authTag: 'authentication-tag',
  },
}

// Test environment constants
export const testConstants = {
  TEST_DATABASE_URL: 'postgresql://test:test@localhost:5432/astralcore_test',
  TEST_ENCRYPTION_KEY: 'test-encryption-key-32-characters',
  TEST_JWT_SECRET: 'test-jwt-secret-key',
  TEST_NEXTAUTH_SECRET: 'test-nextauth-secret-key',
  
  // API endpoints
  endpoints: {
    auth: {
      signin: '/api/auth/signin',
      signup: '/api/auth/signup',
      signout: '/api/auth/signout',
      session: '/api/auth/session',
    },
    user: {
      profile: '/api/user/profile',
      settings: '/api/user/settings',
    },
    crisis: {
      report: '/api/crisis/report',
      support: '/api/crisis/support',
    },
  },

  // Test timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
  },

  // Test data limits
  limits: {
    maxUsers: 100,
    maxEntries: 1000,
    pageSize: 10,
  },
}

// Helper functions for creating test data
export const testHelpers = {
  /**
   * Create a test user with random data
   */
  createTestUser(overrides: Partial<any> = {}): any {
    return {
      ...testUsers.regularUser,
      id: randomUUID(),
      anonymousId: randomUUID(),
      email: `test-${randomUUID()}@example.com`,
      ...overrides,
    }
  },

  /**
   * Create a test session
   */
  createTestSession(userId?: string): any {
    return {
      ...testSessions.validSession,
      id: randomUUID(),
      sessionToken: `test-session-${randomUUID()}`,
      userId: userId || testUsers.regularUser.id,
    }
  },

  /**
   * Create test credentials
   */
  createTestCredentials(): any {
    return {
      email: `test-${randomUUID()}@example.com`,
      password: 'testpassword123',
    }
  },

  /**
   * Get user by role
   */
  getUserByRole(role: UserRole): any {
    const userMap = {
      [UserRole.USER]: testUsers.regularUser,
      [UserRole.HELPER]: testUsers.helperUser,
      [UserRole.THERAPIST]: testUsers.therapistUser,
      [UserRole.CRISIS_COUNSELOR]: testUsers.crisisCounselorUser,
      [UserRole.ADMIN]: testUsers.adminUser,
      [UserRole.SUPER_ADMIN]: testUsers.adminUser,
    }
    return userMap[role] || testUsers.regularUser
  },

  /**
   * Create mock request object
   */
  createMockRequest(options: any = {}): any {
    return {
      method: options.method || 'GET',
      url: options.url || '/test',
      headers: options.headers || apiFixtures.headers,
      body: options.body || {},
      query: options.query || {},
      params: options.params || {},
      ...options,
    }
  },

  /**
   * Create mock response object
   */
  createMockResponse(): any {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      getHeader: jest.fn(),
      headers: {},
    }
    return res
  },

  /**
   * Wait for async operations
   */
  async waitFor(ms: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  },

  /**
   * Generate test UUID
   */
  generateTestId(): string {
    return randomUUID()
  },
}