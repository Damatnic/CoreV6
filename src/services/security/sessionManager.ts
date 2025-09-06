/**
 * Session Management Service
 * HIPAA-compliant secure session handling
 * Supports multiple session types: anonymous, authenticated, emergency
 */

import { securityConfig } from '../../config/security.config';
import { cryptoService } from './cryptoService';
import { auditLogger, AuditEventType, AuditSeverity } from './auditLogger';

export enum SessionType {
  ANONYMOUS = 'anonymous',
  AUTHENTICATED = 'authenticated',
  EMERGENCY = 'emergency',
  PROFESSIONAL = 'professional'
}

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  SUSPENDED = 'suspended'
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  userRole?: string;
  sessionType: SessionType;
  status: SessionStatus;
  
  // Timestamps
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  
  // Security metadata
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  
  // HIPAA compliance
  patientContext?: string;
  accessLevel: 'read' | 'write' | 'admin';
  consentGiven: boolean;
  
  // Session context
  preferences?: Record<string, any>;
  temporaryData?: Record<string, any>;
  securityFlags: {
    mfaVerified: boolean;
    biometricVerified: boolean;
    deviceTrusted: boolean;
    riskScore: number;
  };
  
  // Audit trail
  activityLog: SessionActivity[];
}

export interface SessionActivity {
  timestamp: string;
  action: string;
  resource?: string;
  ipAddress: string;
  success: boolean;
  details?: Record<string, any>;
}

export interface CreateSessionOptions {
  userId?: string;
  userRole?: string;
  sessionType: SessionType;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  patientContext?: string;
  accessLevel?: 'read' | 'write' | 'admin';
  maxIdleMinutes?: number;
}

class SessionManagerService {
  private static instance: SessionManagerService;
  private activeSessions: Map<string, SessionData> = new Map();
  private sessionCleanupInterval?: NodeJS.Timeout;
  
  private readonly SESSION_CLEANUP_INTERVAL = 300000; // 5 minutes
  private readonly MAX_CONCURRENT_SESSIONS_PER_USER = securityConfig.session.maxConcurrent;

  private constructor() {
    this.startSessionCleanup();
  }

  static getInstance(): SessionManagerService {
    if (!SessionManagerService.instance) {
      SessionManagerService.instance = new SessionManagerService();
    }
    return SessionManagerService.instance;
  }

  /**
   * Create a new session
   */
  async createSession(options: CreateSessionOptions): Promise<{
    sessionId: string;
    token: string;
    expiresAt: string;
  }> {
    try {
      // Check concurrent session limit
      if (options.userId) {
        await this.enforceSessionLimits(options.userId);
      }

      // Generate session ID and token
      const sessionId = this.generateSessionId();
      const sessionToken = await this.generateSessionToken(sessionId);
      
      // Calculate expiration
      const maxIdleMinutes = options.maxIdleMinutes || securityConfig.session.maxIdleMinutes;
      const expiresAt = new Date(Date.now() + maxIdleMinutes * 60 * 1000).toISOString();
      
      // Create session data
      const sessionData: SessionData = {
        sessionId,
        userId: options.userId,
        userRole: options.userRole,
        sessionType: options.sessionType,
        status: SessionStatus.ACTIVE,
        
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt,
        
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        deviceFingerprint: options.deviceFingerprint,
        
        patientContext: options.patientContext,
        accessLevel: options.accessLevel || 'read',
        consentGiven: false, // Must be explicitly set
        
        preferences: {},
        temporaryData: {},
        securityFlags: {
          mfaVerified: false,
          biometricVerified: false,
          deviceTrusted: false,
          riskScore: 0
        },
        
        activityLog: [{
          timestamp: new Date().toISOString(),
          action: 'session_created',
          ipAddress: options.ipAddress,
          success: true,
          details: {
            sessionType: options.sessionType,
            userRole: options.userRole
          }
        }]
      };

      // Store session
      this.activeSessions.set(sessionId, sessionData);

      // Log session creation
      await auditLogger.logEvent(
        AuditEventType.LOGIN_SUCCESS,
        'session_created',
        {
          userId: options.userId,
          sessionId,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          severity: AuditSeverity.LOW,
          details: {
            sessionType: options.sessionType,
            accessLevel: options.accessLevel
          }
        }
      );

      return {
        sessionId,
        token: sessionToken,
        expiresAt
      };

    } catch (error) {
      console.error('Session creation failed:', error);
      
      await auditLogger.logEvent(
        AuditEventType.LOGIN_FAILURE,
        'session_creation_failed',
        {
          userId: options.userId,
          ipAddress: options.ipAddress,
          severity: AuditSeverity.HIGH,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      );

      throw new Error('Session creation failed');
    }
  }

  /**
   * Validate and retrieve session
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (this.isSessionExpired(session)) {
      await this.terminateSession(sessionId, 'expired');
      return null;
    }

    // Check if session is active
    if (session.status !== SessionStatus.ACTIVE) {
      return null;
    }

    return session;
  }

  /**
   * Update session activity
   */
  async updateActivity(
    sessionId: string, 
    action: string, 
    context: {
      ipAddress?: string;
      resource?: string;
      success?: boolean;
      details?: Record<string, any>;
    } = {}
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || session.status !== SessionStatus.ACTIVE) {
      return false;
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();
    
    // Extend expiration
    const maxIdleMinutes = securityConfig.session.maxIdleMinutes;
    session.expiresAt = new Date(Date.now() + maxIdleMinutes * 60 * 1000).toISOString();

    // Add to activity log
    const activity: SessionActivity = {
      timestamp: new Date().toISOString(),
      action,
      resource: context.resource,
      ipAddress: context.ipAddress || session.ipAddress,
      success: context.success !== false,
      details: context.details
    };

    session.activityLog.push(activity);

    // Limit activity log size
    if (session.activityLog.length > 100) {
      session.activityLog = session.activityLog.slice(-100);
    }

    // Security validation
    if (context.ipAddress && context.ipAddress !== session.ipAddress) {
      if (securityConfig.session.bindToIP) {
        await this.terminateSession(sessionId, 'security_violation');
        
        await auditLogger.logEvent(
          AuditEventType.SUSPICIOUS_ACTIVITY,
          'ip_address_change',
          {
            userId: session.userId,
            sessionId,
            ipAddress: context.ipAddress,
            severity: AuditSeverity.HIGH,
            details: {
              originalIP: session.ipAddress,
              newIP: context.ipAddress
            }
          }
        );

        return false;
      } else {
        // Log IP change but allow session to continue
        session.activityLog.push({
          timestamp: new Date().toISOString(),
          action: 'ip_address_changed',
          ipAddress: context.ipAddress,
          success: true,
          details: {
            originalIP: session.ipAddress,
            newIP: context.ipAddress
          }
        });
      }
    }

    return true;
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string, reason: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    // Update session status
    session.status = reason === 'expired' ? SessionStatus.EXPIRED : SessionStatus.TERMINATED;

    // Add termination to activity log
    session.activityLog.push({
      timestamp: new Date().toISOString(),
      action: 'session_terminated',
      ipAddress: session.ipAddress,
      success: true,
      details: { reason }
    });

    // Log session termination
    await auditLogger.logEvent(
      reason === 'expired' ? AuditEventType.SESSION_TIMEOUT : AuditEventType.LOGOUT,
      'session_terminated',
      {
        userId: session.userId,
        sessionId,
        ipAddress: session.ipAddress,
        severity: AuditSeverity.LOW,
        details: { reason }
      }
    );

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    return true;
  }

  /**
   * Update session security flags
   */
  async updateSecurityFlags(
    sessionId: string,
    flags: Partial<SessionData['securityFlags']>
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || session.status !== SessionStatus.ACTIVE) {
      return false;
    }

    // Update security flags
    session.securityFlags = {
      ...session.securityFlags,
      ...flags
    };

    // Log security flag changes
    await this.updateActivity(sessionId, 'security_flags_updated', {
      success: true,
      details: { updatedFlags: flags }
    });

    return true;
  }

  /**
   * Set patient context with consent
   */
  async setPatientContext(
    sessionId: string,
    patientId: string,
    consentGiven: boolean
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || session.status !== SessionStatus.ACTIVE) {
      return false;
    }

    session.patientContext = patientId;
    session.consentGiven = consentGiven;

    // Log patient context access
    await auditLogger.logPHIAccess(
      patientId,
      ['patient_context'],
      {
        userId: session.userId,
        sessionId,
        ipAddress: session.ipAddress,
        details: { consentGiven }
      }
    );

    return true;
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): SessionData[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.status === SessionStatus.ACTIVE);
  }

  /**
   * Terminate all user sessions
   */
  async terminateUserSessions(userId: string, reason: string = 'admin_action'): Promise<number> {
    const userSessions = this.getUserSessions(userId);
    let terminatedCount = 0;

    for (const session of userSessions) {
      const success = await this.terminateSession(session.sessionId, reason);
      if (success) {
        terminatedCount++;
      }
    }

    return terminatedCount;
  }

  /**
   * Generate session token
   */
  private async generateSessionToken(sessionId: string): Promise<string> {
    const tokenData = {
      sessionId,
      timestamp: Date.now(),
      random: cryptoService.generateSecureToken(16)
    };

    const tokenString = JSON.stringify(tokenData);
    return await cryptoService.encryptField(tokenString, 'session_token');
  }

  /**
   * Validate session token
   */
  async validateSessionToken(token: string): Promise<string | null> {
    try {
      const decryptedToken = await cryptoService.decryptField(token, 'session_token');
      const tokenData = JSON.parse(decryptedToken);
      
      // Basic token validation
      if (!tokenData.sessionId || !tokenData.timestamp) {
        return null;
      }

      // Check if token is too old (token timeout)
      const tokenAge = Date.now() - tokenData.timestamp;
      const maxTokenAge = securityConfig.session.absoluteTimeoutHours * 60 * 60 * 1000;
      
      if (tokenAge > maxTokenAge) {
        return null;
      }

      return tokenData.sessionId;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: SessionData): boolean {
    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    
    return now > expiresAt;
  }

  /**
   * Enforce session limits per user
   */
  private async enforceSessionLimits(userId: string): Promise<void> {
    const userSessions = this.getUserSessions(userId);
    
    if (userSessions.length >= this.MAX_CONCURRENT_SESSIONS_PER_USER) {
      // Terminate oldest session
      const oldestSession = userSessions
        .sort((a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime())[0];
      
      if (oldestSession) {
        await this.terminateSession(oldestSession.sessionId, 'session_limit_exceeded');
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = cryptoService.generateSecureToken(16);
    return `sess_${timestamp}_${random}`;
  }

  /**
   * Start periodic session cleanup
   */
  private startSessionCleanup(): void {
    this.sessionCleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, this.SESSION_CLEANUP_INTERVAL);
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const sessionsToRemove: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      // Check for expired sessions
      if (this.isSessionExpired(session)) {
        sessionsToRemove.push(sessionId);
        continue;
      }

      // Check for inactive sessions
      const lastActivity = new Date(session.lastActivity).getTime();
      const inactiveThreshold = securityConfig.session.maxIdleMinutes * 60 * 1000;
      
      if (now - lastActivity > inactiveThreshold) {
        sessionsToRemove.push(sessionId);
      }
    }

    // Remove expired/inactive sessions
    for (const sessionId of sessionsToRemove) {
      await this.terminateSession(sessionId, 'expired');
    }

    if (sessionsToRemove.length > 0) {
      console.log(`Cleaned up ${sessionsToRemove.length} expired sessions`);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalActiveSessions: number;
    sessionsByType: Record<SessionType, number>;
    sessionsByStatus: Record<SessionStatus, number>;
    averageSessionAge: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const now = Date.now();

    const sessionsByType = sessions.reduce((acc, session) => {
      acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
      return acc;
    }, {} as Record<SessionType, number>);

    const sessionsByStatus = sessions.reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {} as Record<SessionStatus, number>);

    const totalAge = sessions.reduce((sum, session) => {
      return sum + (now - new Date(session.createdAt).getTime());
    }, 0);

    const averageSessionAge = sessions.length > 0 ? totalAge / sessions.length : 0;

    return {
      totalActiveSessions: sessions.length,
      sessionsByType,
      sessionsByStatus,
      averageSessionAge: Math.round(averageSessionAge / 1000 / 60) // minutes
    };
  }

  /**
   * Emergency session access
   */
  async createEmergencySession(
    ipAddress: string,
    userAgent: string,
    crisisContext: Record<string, any>
  ): Promise<{ sessionId: string; token: string }> {
    const result = await this.createSession({
      sessionType: SessionType.EMERGENCY,
      ipAddress,
      userAgent,
      accessLevel: 'read',
      maxIdleMinutes: 120, // Longer timeout for crisis situations
    });

    // Log emergency session creation
    await auditLogger.logEvent(
      AuditEventType.EMERGENCY_ACCESS,
      'emergency_session_created',
      {
        sessionId: result.sessionId,
        ipAddress,
        severity: AuditSeverity.HIGH,
        details: crisisContext
      }
    );

    return result;
  }

  /**
   * Create anonymous session for non-authenticated users
   */
  async createAnonymousSession(options: Partial<CreateSessionOptions> = {}): Promise<{ sessionId: string; token: string }> {
    const sessionOptions: CreateSessionOptions = {
      sessionType: SessionType.ANONYMOUS,
      ipAddress: options.ipAddress || '0.0.0.0',
      userAgent: options.userAgent || 'Unknown',
      accessLevel: 'read',
      maxIdleMinutes: 30,
      ...options
    };

    return this.createSession(sessionOptions);
  }

  /**
   * Invalidate session (alias for terminateSession)
   */
  async invalidateSession(sessionId: string, reason: string = 'invalidated'): Promise<boolean> {
    return this.terminateSession(sessionId, reason);
  }

  /**
   * Cleanup on service shutdown
   */
  async shutdown(): Promise<void> {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }

    // Terminate all active sessions
    const activeSessions = Array.from(this.activeSessions.keys());
    for (const sessionId of activeSessions) {
      await this.terminateSession(sessionId, 'system_shutdown');
    }

    console.log('Session manager shutdown complete');
  }
}

// Export singleton instance
export const sessionManager = SessionManagerService.getInstance();

// Convenience functions
export const createSession = (options: CreateSessionOptions) => sessionManager.createSession(options);
export const getSession = (sessionId: string) => sessionManager.getSession(sessionId);
export const terminateSession = (sessionId: string, reason: string) => sessionManager.terminateSession(sessionId, reason);
export const updateSessionActivity = (sessionId: string, action: string, context?: any) => 
  sessionManager.updateActivity(sessionId, action, context);