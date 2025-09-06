/**
 * Security Monitoring Service
 * Real-time security monitoring and threat detection
 * HIPAA-compliant security event processing
 */

import { securityConfig } from '../../config/security.config';
import { auditLogger, AuditEventType, AuditSeverity } from './auditLogger';

export interface SecurityMetrics {
  timestamp: string;
  totalRequests: number;
  failedLogins: number;
  suspiciousActivities: number;
  encryptionFailures: number;
  sessionTimeouts: number;
  rateLimitExceeded: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface ThreatDetection {
  type: 'brute_force' | 'sql_injection' | 'xss_attempt' | 'unusual_access_pattern' | 'data_exfiltration';
  severity: AuditSeverity;
  description: string;
  indicators: string[];
  recommendations: string[];
  autoMitigated: boolean;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  type: string;
  severity: AuditSeverity;
  message: string;
  source: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

class SecurityMonitorService {
  private static instance: SecurityMonitorService;
  private activeAlerts: Map<string, SecurityAlert> = new Map();
  private securityMetrics: SecurityMetrics[] = [];
  private threatPatterns: Map<string, number> = new Map();
  private ipRiskScores: Map<string, number> = new Map();
  private userRiskScores: Map<string, number> = new Map();
  
  private readonly MAX_METRICS_HISTORY = 1000;
  private readonly THREAT_DETECTION_INTERVAL = 60000; // 1 minute
  private readonly ALERT_CLEANUP_INTERVAL = 86400000; // 24 hours

  private constructor() {
    this.startThreatDetection();
    this.startMetricsCollection();
    this.startAlertCleanup();
  }

  static getInstance(): SecurityMonitorService {
    if (!SecurityMonitorService.instance) {
      SecurityMonitorService.instance = new SecurityMonitorService();
    }
    return SecurityMonitorService.instance;
  }

  /**
   * Process security event for monitoring
   */
  async processSecurityEvent(
    eventType: string,
    details: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      requestPath?: string;
      success?: boolean;
      errorMessage?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    try {
      // Update risk scores
      await this.updateRiskScores(details);

      // Check for threat patterns
      const threats = await this.detectThreats(eventType, details);

      // Process detected threats
      for (const threat of threats) {
        await this.handleThreatDetection(threat, details);
      }

      // Update security metrics
      await this.updateSecurityMetrics(eventType, details);

      // Check for alert conditions
      await this.checkAlertConditions();

    } catch (error) {
      console.error('Security monitoring error:', error);
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_START,
        'security_monitoring_error',
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          severity: AuditSeverity.HIGH
        }
      );
    }
  }

  /**
   * Get current security metrics
   */
  getCurrentMetrics(): SecurityMetrics | null {
    return this.securityMetrics[this.securityMetrics.length - 1] || null;
  }

  /**
   * Get security metrics history
   */
  getMetricsHistory(hours: number = 24): SecurityMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.securityMetrics.filter(metric => 
      new Date(metric.timestamp) >= cutoffTime
    );
  }

  /**
   * Get active security alerts
   */
  getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => {
        const severityOrder = {
          [AuditSeverity.CRITICAL]: 4,
          [AuditSeverity.HIGH]: 3,
          [AuditSeverity.MEDIUM]: 2,
          [AuditSeverity.LOW]: 1
        };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Get IP risk score
   */
  getIPRiskScore(ipAddress: string): number {
    return this.ipRiskScores.get(ipAddress) || 0;
  }

  /**
   * Get user risk score
   */
  getUserRiskScore(userId: string): number {
    return this.userRiskScores.get(userId) || 0;
  }

  /**
   * Create security alert
   */
  async createAlert(
    type: string,
    severity: AuditSeverity,
    message: string,
    details: Partial<SecurityAlert>
  ): Promise<string> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      type,
      severity,
      message,
      source: 'security_monitor',
      resolved: false,
      ...details
    };

    this.activeAlerts.set(alert.id, alert);

    // Log alert to audit trail
    await auditLogger.logEvent(
      AuditEventType.SECURITY_BREACH,
      'security_alert_created',
      {
        severity,
        details: { alertType: type, alertMessage: message },
        userId: alert.userId,
        ipAddress: alert.ipAddress,
        userAgent: alert.userAgent
      }
    );

    // Send real-time notification
    await this.sendAlertNotification(alert);

    return alert.id;
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = resolvedBy;

    await auditLogger.logEvent(
      AuditEventType.SECURITY_BREACH,
      'security_alert_resolved',
      {
        severity: AuditSeverity.LOW,
        details: { alertId, resolvedBy },
        userId: resolvedBy
      }
    );

    return true;
  }

  /**
   * Track anonymous session activity
   */
  async trackAnonymousSession(sessionId: string, activity: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.processSecurityEvent('anonymous_session_activity', {
      sessionId,
      activity,
      eventType: 'session_activity',
      success: true,
      ...metadata
    });
  }

  /**
   * Report security event
   */
  async reportSecurityEvent(eventType: string, details: Record<string, any>): Promise<void> {
    await this.processSecurityEvent(eventType, {
      ...details,
      eventType,
      reported: true,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Update risk scores based on activity
   */
  private async updateRiskScores(details: any): Promise<void> {
    if (details.ipAddress) {
      const currentScore = this.ipRiskScores.get(details.ipAddress) || 0;
      let scoreChange = 0;

      // Increase risk for suspicious activities
      if (!details.success) scoreChange += 5;
      if (details.eventType === 'login_failure') scoreChange += 10;
      if (details.eventType === 'suspicious_activity') scoreChange += 20;
      if (details.eventType === 'security_breach') scoreChange += 50;

      // Decrease risk for normal activities (slowly)
      if (details.success && details.eventType !== 'security_breach') {
        scoreChange -= 1;
      }

      const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
      this.ipRiskScores.set(details.ipAddress, newScore);
    }

    if (details.userId) {
      const currentScore = this.userRiskScores.get(details.userId) || 0;
      let scoreChange = 0;

      // Similar scoring logic for users
      if (!details.success) scoreChange += 3;
      if (details.eventType === 'login_failure') scoreChange += 8;
      if (details.eventType === 'suspicious_activity') scoreChange += 15;
      if (details.eventType === 'security_breach') scoreChange += 30;

      if (details.success && details.eventType !== 'security_breach') {
        scoreChange -= 0.5;
      }

      const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
      this.userRiskScores.set(details.userId, newScore);
    }
  }

  /**
   * Detect threat patterns
   */
  private async detectThreats(eventType: string, details: any): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];

    // Brute force detection
    if (eventType === 'login_failure' && details.ipAddress) {
      const recentFailures = this.countRecentEvents(
        `login_failure_${details.ipAddress}`,
        300000 // 5 minutes
      );

      if (recentFailures >= 5) {
        threats.push({
          type: 'brute_force',
          severity: AuditSeverity.HIGH,
          description: 'Multiple failed login attempts detected',
          indicators: [`${recentFailures} failed attempts from IP ${details.ipAddress}`],
          recommendations: ['Block IP address', 'Implement CAPTCHA', 'Enable MFA'],
          autoMitigated: false
        });
      }
    }

    // SQL Injection detection
    if (details.requestPath || details.queryString) {
      const sqlPatterns = [
        /union.*select/i,
        /drop.*table/i,
        /insert.*into/i,
        /update.*set/i,
        /delete.*from/i,
        /'.*or.*'.*='/i
      ];

      const content = `${details.requestPath || ''} ${details.queryString || ''}`;
      const matchedPatterns = sqlPatterns.filter(pattern => pattern.test(content));

      if (matchedPatterns.length > 0) {
        threats.push({
          type: 'sql_injection',
          severity: AuditSeverity.CRITICAL,
          description: 'SQL injection attempt detected',
          indicators: [`Suspicious SQL patterns in request: ${content}`],
          recommendations: ['Block request', 'Review input validation', 'Check logs for similar attempts'],
          autoMitigated: true
        });
      }
    }

    // XSS detection
    if (details.requestBody || details.queryString) {
      const xssPatterns = [
        /<script.*?>.*?<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe.*?>/i
      ];

      const content = `${details.requestBody || ''} ${details.queryString || ''}`;
      const matchedPatterns = xssPatterns.filter(pattern => pattern.test(content));

      if (matchedPatterns.length > 0) {
        threats.push({
          type: 'xss_attempt',
          severity: AuditSeverity.HIGH,
          description: 'Cross-site scripting attempt detected',
          indicators: [`Suspicious script patterns in request: ${content}`],
          recommendations: ['Block request', 'Review content filtering', 'Implement CSP'],
          autoMitigated: true
        });
      }
    }

    // Unusual access pattern detection
    if (details.userId) {
      const userRiskScore = this.getUserRiskScore(details.userId);
      if (userRiskScore > 70) {
        threats.push({
          type: 'unusual_access_pattern',
          severity: AuditSeverity.MEDIUM,
          description: 'Unusual user access pattern detected',
          indicators: [`User risk score: ${userRiskScore}`],
          recommendations: ['Monitor user activity', 'Require additional authentication'],
          autoMitigated: false
        });
      }
    }

    return threats;
  }

  /**
   * Handle detected threats
   */
  private async handleThreatDetection(threat: ThreatDetection, details: any): Promise<void> {
    // Create security alert
    await this.createAlert(
      threat.type,
      threat.severity,
      threat.description,
      {
        userId: details.userId,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        details: {
          indicators: threat.indicators,
          recommendations: threat.recommendations,
          autoMitigated: threat.autoMitigated
        }
      }
    );

    // Auto-mitigation for certain threats
    if (threat.autoMitigated) {
      await this.performAutoMitigation(threat, details);
    }
  }

  /**
   * Perform automatic threat mitigation
   */
  private async performAutoMitigation(threat: ThreatDetection, details: any): Promise<void> {
    switch (threat.type) {
      case 'sql_injection':
      case 'xss_attempt':
        // Block the request (already handled by middleware)
        // Log the attempted attack
        await auditLogger.logEvent(
          AuditEventType.SECURITY_BREACH,
          `blocked_${threat.type}`,
          {
            severity: threat.severity,
            ipAddress: details.ipAddress,
            userAgent: details.userAgent,
            details: { threat: threat.description }
          }
        );
        break;

      case 'brute_force':
        // Temporarily block IP (implement in production)
        console.warn(`Auto-mitigation: Brute force from ${details.ipAddress}`);
        break;
    }
  }

  /**
   * Update security metrics
   */
  private async updateSecurityMetrics(eventType: string, details: any): Promise<void> {
    const now = new Date().toISOString();
    const currentMetrics = this.getCurrentMetrics();

    const newMetrics: SecurityMetrics = {
      timestamp: now,
      totalRequests: (currentMetrics?.totalRequests || 0) + 1,
      failedLogins: currentMetrics?.failedLogins || 0,
      suspiciousActivities: currentMetrics?.suspiciousActivities || 0,
      encryptionFailures: currentMetrics?.encryptionFailures || 0,
      sessionTimeouts: currentMetrics?.sessionTimeouts || 0,
      rateLimitExceeded: currentMetrics?.rateLimitExceeded || 0,
      systemHealth: 'healthy'
    };

    // Update specific metrics based on event type
    switch (eventType) {
      case 'login_failure':
        newMetrics.failedLogins++;
        break;
      case 'suspicious_activity':
        newMetrics.suspiciousActivities++;
        break;
      case 'encryption_failure':
        newMetrics.encryptionFailures++;
        break;
      case 'session_timeout':
        newMetrics.sessionTimeouts++;
        break;
      case 'rate_limit_exceeded':
        newMetrics.rateLimitExceeded++;
        break;
    }

    // Determine system health
    newMetrics.systemHealth = this.calculateSystemHealth(newMetrics);

    this.securityMetrics.push(newMetrics);

    // Trim metrics history
    if (this.securityMetrics.length > this.MAX_METRICS_HISTORY) {
      this.securityMetrics = this.securityMetrics.slice(-this.MAX_METRICS_HISTORY);
    }
  }

  /**
   * Calculate system health status
   */
  private calculateSystemHealth(metrics: SecurityMetrics): 'healthy' | 'warning' | 'critical' {
    const recentMetrics = this.securityMetrics.slice(-10); // Last 10 data points
    
    // Calculate rates
    const avgFailedLogins = recentMetrics.reduce((sum, m) => sum + m.failedLogins, 0) / recentMetrics.length;
    const avgSuspicious = recentMetrics.reduce((sum, m) => sum + m.suspiciousActivities, 0) / recentMetrics.length;
    const totalEncryptionFailures = metrics.encryptionFailures;

    // Health thresholds
    if (totalEncryptionFailures > 0 || avgSuspicious > 10) {
      return 'critical';
    }
    
    if (avgFailedLogins > 20 || avgSuspicious > 5) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Check for alert conditions
   */
  private async checkAlertConditions(): Promise<void> {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) return;

    // System health degradation
    if (currentMetrics.systemHealth === 'critical') {
      await this.createAlert(
        'system_health_critical',
        AuditSeverity.CRITICAL,
        'System health status is critical',
        {
          details: { metrics: currentMetrics }
        }
      );
    }

    // High number of security events
    const recentAlerts = this.getActiveAlerts().filter(alert => {
      const alertTime = new Date(alert.timestamp);
      const oneHourAgo = new Date(Date.now() - 3600000);
      return alertTime > oneHourAgo;
    });

    if (recentAlerts.length > 10) {
      await this.createAlert(
        'high_alert_volume',
        AuditSeverity.HIGH,
        `${recentAlerts.length} security alerts in the last hour`,
        {
          details: { recentAlertCount: recentAlerts.length }
        }
      );
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: SecurityAlert): Promise<void> {
    if (!securityConfig.monitoring.realTimeAlerts) return;

    // In production, integrate with notification services
    console.warn('[SECURITY ALERT]', {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp
    });

    // TODO: Integrate with:
    // - Email notifications
    // - Slack/Teams alerts
    // - PagerDuty for critical alerts
    // - SMS for emergency alerts
  }

  /**
   * Count recent events by pattern
   */
  private countRecentEvents(pattern: string, timeWindow: number): number {
    const count = this.threatPatterns.get(pattern) || 0;
    
    // Increment pattern count
    this.threatPatterns.set(pattern, count + 1);
    
    // Clean old patterns (simplified - in production use proper time-based cleanup)
    setTimeout(() => {
      const currentCount = this.threatPatterns.get(pattern) || 0;
      if (currentCount > 0) {
        this.threatPatterns.set(pattern, currentCount - 1);
      }
    }, timeWindow);
    
    return count + 1;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start threat detection monitoring
   */
  private startThreatDetection(): void {
    setInterval(() => {
      // Periodic threat analysis
      this.performPeriodicThreatAnalysis();
    }, this.THREAT_DETECTION_INTERVAL);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Collect baseline metrics every minute
    setInterval(() => {
      this.updateSecurityMetrics('periodic_collection', {});
    }, 60000);
  }

  /**
   * Start alert cleanup
   */
  private startAlertCleanup(): void {
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - this.ALERT_CLEANUP_INTERVAL);
      
      for (const [id, alert] of this.activeAlerts.entries()) {
        if (alert.resolved && new Date(alert.timestamp) < cutoffTime) {
          this.activeAlerts.delete(id);
        }
      }
    }, this.ALERT_CLEANUP_INTERVAL);
  }

  /**
   * Perform periodic threat analysis
   */
  private async performPeriodicThreatAnalysis(): Promise<void> {
    // Analyze patterns and trends
    // In production, this would include ML-based analysis
    
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) return;

    // Check for trending issues
    const recentMetrics = this.securityMetrics.slice(-5);
    if (recentMetrics.length >= 5) {
      const trend = this.analyzeTrends(recentMetrics);
      
      if (trend.increasing && trend.severity > 0.7) {
        await this.createAlert(
          'security_trend_warning',
          AuditSeverity.MEDIUM,
          `Increasing security events detected: ${trend.description}`,
          {
            details: { trend }
          }
        );
      }
    }
  }

  /**
   * Analyze security trends
   */
  private analyzeTrends(metrics: SecurityMetrics[]): {
    increasing: boolean;
    severity: number;
    description: string;
  } {
    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    
    if (!first || !last) {
      return {
        increasing: false,
        severity: 0,
        description: 'Insufficient metrics data'
      };
    }

    const failedLoginIncrease = (last.failedLogins - first.failedLogins) / Math.max(first.failedLogins, 1);
    const suspiciousIncrease = (last.suspiciousActivities - first.suspiciousActivities) / Math.max(first.suspiciousActivities, 1);

    const maxIncrease = Math.max(failedLoginIncrease, suspiciousIncrease);
    
    return {
      increasing: maxIncrease > 0.5,
      severity: maxIncrease,
      description: `Failed logins increased by ${(failedLoginIncrease * 100).toFixed(1)}%, suspicious activities by ${(suspiciousIncrease * 100).toFixed(1)}%`
    };
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitorService.getInstance();