/**
 * Monitoring System Index
 * Central export for all monitoring services
 */

// Configuration
export { 
  getMonitoringConfig, 
  validateMonitoringConfig, 
  defaultMonitoringConfig,
  type MonitoringConfig 
} from './config';

// Performance Monitoring
export { 
  performanceMonitor,
  performanceMiddleware,
  type PerformanceMetrics,
  type ResponseTimeEntry,
  type DatabaseQueryEntry
} from './performance-monitor';

// Health Checks
export { 
  healthCheckService,
  type HealthStatus,
  type HealthCheckResult,
  type SystemHealth,
  type HealthCheckConfig
} from './health-check';

// Alert Management
export { 
  alertManager,
  type Alert,
  type AlertRule,
  type AlertCondition,
  type AlertStats,
  type AlertSeverity,
  type AlertStatus,
  type EscalationPolicy,
  type NotificationChannel
} from './alert-manager';

// Audit Trail
export { 
  auditTrailService,
  type AuditEvent,
  type AuditEventType,
  type AuditQuery,
  type AuditStats,
  type ComplianceReport,
  type AuditLogLevel,
  type DataClassification
} from './audit-trail';

// Error Tracking
export { 
  errorTracker,
  errorTrackingMiddleware,
  withErrorTracking,
  type ErrorInfo,
  type ErrorGroup,
  type ErrorStats,
  type Breadcrumb,
  type ErrorReportConfig
} from './error-tracker';

// Analytics
export { 
  analyticsService,
  type AnalyticsEvent,
  type AnalyticsEventType,
  type UserJourney,
  type FeatureUsage,
  type TreatmentOutcome,
  type CrisisAnalytics,
  type EngagementMetrics,
  type AnalyticsConfig
} from './analytics';

// Convenience function to initialize all monitoring services
export const initializeMonitoring = async () => {
  console.log('Initializing Astral Core monitoring system...');
  
  try {
    // Initialize health checks
    healthCheckService.start();
    console.log('✓ Health check service started');
    
    // Initialize performance monitoring
    performanceMonitor.startMonitoring();
    console.log('✓ Performance monitoring started');
    
    // Initialize error tracking
    errorTracker.initialize();
    console.log('✓ Error tracking initialized');
    
    // Initialize analytics
    analyticsService.initialize();
    console.log('✓ Analytics service initialized');
    
    console.log('✅ Monitoring system initialized successfully');
    
    return {
      health: healthCheckService,
      performance: performanceMonitor,
      alerts: alertManager,
      audit: auditTrailService,
      errors: errorTracker,
      analytics: analyticsService,
    };
  } catch (error) {
    console.error('❌ Failed to initialize monitoring system:', error);
    throw error;
  }
};

// Convenience function to get system status
export const getSystemStatus = async () => {
  const [health, stats, alertStats, auditStats] = await Promise.all([
    healthCheckService.getSystemHealth(),
    performanceMonitor.getCurrentMetrics(),
    alertManager.getStats(),
    auditTrailService.getStats(),
  ]);
  
  return {
    timestamp: Date.now(),
    overall: health.overall,
    uptime: health.uptime,
    services: {
      health: {
        status: health.overall,
        services: health.services.length,
        healthyServices: health.services.filter(s => s.status === 'healthy').length,
      },
      performance: {
        responseTime: stats.responses.averageTime,
        errorRate: stats.responses.errorRate,
        memoryUsage: stats.memory.percentage,
        cpuUsage: stats.cpu.usage,
      },
      alerts: {
        active: alertStats.activeAlerts,
        total: alertStats.totalAlerts,
        critical: alertStats.alertsBySeverity.critical || 0,
      },
      audit: {
        events: auditStats.totalEvents,
        phiAccess: auditStats.phiAccessCount,
        securityEvents: auditStats.securityEventsCount,
      },
    },
  };
};

// Export types for convenience
export type {
  HealthStatus,
  AlertSeverity,
  AuditEventType,
  AnalyticsEventType,
} from './index';