/**
 * Consent Management Service
 * GDPR and HIPAA compliant consent tracking and management
 * Handles data retention policies and automated data lifecycle
 */

import { auditLogger, AuditEventType } from '../security/auditLogger';
import { privacyService, DataCategory } from '../privacy/privacyService';

// Types of consent required by law
export enum ConsentType {
  // GDPR Consent
  DATA_PROCESSING = 'data_processing',
  MARKETING = 'marketing',
  COOKIES = 'cookies',
  ANALYTICS = 'analytics',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  
  // HIPAA Authorization
  TREATMENT = 'treatment',
  PAYMENT = 'payment',
  HEALTHCARE_OPERATIONS = 'healthcare_operations',
  RESEARCH = 'research',
  DISCLOSURE = 'disclosure',
  
  // Mental Health Specific
  CRISIS_CONTACT = 'crisis_contact',
  EMERGENCY_CONTACT = 'emergency_contact',
  FAMILY_NOTIFICATION = 'family_notification',
  THERAPY_RECORDING = 'therapy_recording'
}

// Legal basis for data processing (GDPR)
export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

// Consent status
export enum ConsentStatus {
  PENDING = 'pending',
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired'
}

// Individual consent record
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  legalBasis: LegalBasis;
  
  // Consent details
  purpose: string;
  dataCategories: DataCategory[];
  thirdParties?: string[];
  
  // Timestamps
  requestedAt: Date;
  grantedAt?: Date;
  expiresAt?: Date;
  withdrawnAt?: Date;
  
  // Compliance tracking
  ipAddress: string;
  userAgent: string;
  consentMethod: 'explicit' | 'implied' | 'opt_in' | 'opt_out';
  consentText: string; // Exact text user consented to
  
  // Granular controls
  granularSettings?: Record<string, boolean>;
  
  // Audit trail
  version: string;
  parentConsentId?: string; // For consent updates
  history: ConsentHistoryEntry[];
}

export interface ConsentHistoryEntry {
  timestamp: Date;
  action: 'requested' | 'granted' | 'denied' | 'withdrawn' | 'updated' | 'expired';
  reason?: string;
  ipAddress: string;
  userAgent: string;
  changes?: Record<string, any>;
}

// Data retention policy
export interface RetentionPolicy {
  id: string;
  name: string;
  dataCategory: DataCategory;
  retentionPeriod: number; // days, 0 = indefinite, -1 = immediate deletion
  legalBasis: LegalBasis;
  
  // Deletion triggers
  triggers: RetentionTrigger[];
  
  // Exceptions
  exceptions: RetentionException[];
  
  // Compliance requirements
  regulations: string[]; // GDPR, HIPAA, etc.
  jurisdiction: string;
  
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface RetentionTrigger {
  type: 'time_based' | 'event_based' | 'consent_withdrawn' | 'account_deleted';
  condition: string;
  action: 'delete' | 'anonymize' | 'archive' | 'review';
}

export interface RetentionException {
  type: 'legal_hold' | 'ongoing_case' | 'active_treatment' | 'regulatory_requirement';
  condition: string;
  extendedRetention: number; // additional days
  justification: string;
}

// Consent preferences for bulk operations
export interface ConsentBundle {
  userId: string;
  consents: Array<{
    type: ConsentType;
    granted: boolean;
    granularSettings?: Record<string, boolean>;
  }>;
  consentMethod: 'explicit' | 'implied' | 'opt_in' | 'opt_out';
  ipAddress: string;
  userAgent: string;
}

class ConsentService {
  private static instance: ConsentService;
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();
  private retentionJobs: NodeJS.Timeout[] = [];

  private constructor() {
    this.initializeDefaultPolicies();
    this.startRetentionScheduler();
  }

  static getInstance(): ConsentService {
    if (!ConsentService.instance) {
      ConsentService.instance = new ConsentService();
    }
    return ConsentService.instance;
  }

  /**
   * Request consent from user
   */
  async requestConsent(
    userId: string,
    consentType: ConsentType,
    purpose: string,
    dataCategories: DataCategory[],
    options: {
      legalBasis?: LegalBasis;
      thirdParties?: string[];
      expirationDays?: number;
      granularOptions?: Record<string, string>;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<ConsentRecord> {
    try {
      const consentRecord: ConsentRecord = {
        id: this.generateConsentId(),
        userId,
        consentType,
        status: ConsentStatus.PENDING,
        legalBasis: options.legalBasis || LegalBasis.CONSENT,
        purpose,
        dataCategories,
        thirdParties: options.thirdParties,
        requestedAt: new Date(),
        expiresAt: options.expirationDays 
          ? new Date(Date.now() + options.expirationDays * 24 * 60 * 60 * 1000)
          : undefined,
        ipAddress: options.ipAddress || 'unknown',
        userAgent: options.userAgent || 'unknown',
        consentMethod: 'explicit',
        consentText: this.generateConsentText(consentType, purpose, dataCategories),
        version: '1.0',
        history: [{
          timestamp: new Date(),
          action: 'requested',
          ipAddress: options.ipAddress || 'unknown',
          userAgent: options.userAgent || 'unknown'
        }]
      };

      this.consentRecords.set(consentRecord.id, consentRecord);

      await auditLogger.logEvent(
        AuditEventType.SYSTEM_START,
        'consent_requested',
        {
          userId,
          consentType,
          purpose,
          dataCategories,
          consentId: consentRecord.id,
          details: {
            legalBasis: options.legalBasis,
            thirdParties: options.thirdParties,
            expirationDays: options.expirationDays
          }
        }
      );

      return consentRecord;

    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.CONFIGURATION_CHANGE,
        'consent_request_failed',
        {
          userId,
          consentType,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          outcome: 'failure'
        }
      );
      throw error;
    }
  }

  /**
   * Grant consent
   */
  async grantConsent(
    consentId: string,
    granularSettings?: Record<string, boolean>,
    consentMethod: 'explicit' | 'implied' | 'opt_in' | 'opt_out' = 'explicit',
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<ConsentRecord> {
    const record = this.consentRecords.get(consentId);
    if (!record) {
      throw new Error('Consent record not found');
    }

    if (record.status !== ConsentStatus.PENDING) {
      throw new Error('Consent is not in pending status');
    }

    // Update record
    record.status = ConsentStatus.GRANTED;
    record.grantedAt = new Date();
    record.consentMethod = consentMethod;
    record.granularSettings = granularSettings;
    
    // Add to history
    record.history.push({
      timestamp: new Date(),
      action: 'granted',
      ipAddress,
      userAgent,
      changes: { granularSettings }
    });

    await auditLogger.logEvent(
      AuditEventType.SYSTEM_START,
      'consent_granted',
      {
        userId: record.userId,
        consentType: record.consentType,
        consentId,
        consentMethod,
        details: {
          purpose: record.purpose,
          dataCategories: record.dataCategories,
          granularSettings
        }
      }
    );

    return record;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    consentId: string,
    reason: string = 'User request',
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<ConsentRecord> {
    const record = this.consentRecords.get(consentId);
    if (!record) {
      throw new Error('Consent record not found');
    }

    if (record.status !== ConsentStatus.GRANTED) {
      throw new Error('Can only withdraw granted consent');
    }

    // Update record
    record.status = ConsentStatus.WITHDRAWN;
    record.withdrawnAt = new Date();
    
    // Add to history
    record.history.push({
      timestamp: new Date(),
      action: 'withdrawn',
      reason,
      ipAddress,
      userAgent
    });

    await auditLogger.logEvent(
      AuditEventType.SYSTEM_START,
      'consent_withdrawn',
      {
        userId: record.userId,
        consentType: record.consentType,
        consentId,
        reason,
        details: {
          purpose: record.purpose,
          dataCategories: record.dataCategories
        }
      }
    );

    // Trigger data deletion if required
    await this.handleConsentWithdrawal(record);

    return record;
  }

  /**
   * Process bulk consent bundle
   */
  async processConsentBundle(bundle: ConsentBundle): Promise<ConsentRecord[]> {
    const results: ConsentRecord[] = [];

    for (const consentItem of bundle.consents) {
      try {
        // Request consent
        const record = await this.requestConsent(
          bundle.userId,
          consentItem.type,
          this.getDefaultPurpose(consentItem.type),
          this.getDefaultDataCategories(consentItem.type),
          {
            ipAddress: bundle.ipAddress,
            userAgent: bundle.userAgent
          }
        );

        // Grant or deny based on user choice
        if (consentItem.granted) {
          await this.grantConsent(
            record.id,
            consentItem.granularSettings,
            bundle.consentMethod,
            bundle.ipAddress,
            bundle.userAgent
          );
        } else {
          await this.denyConsent(record.id, bundle.ipAddress, bundle.userAgent);
        }

        results.push(record);

      } catch (error) {
        console.error(`Failed to process consent for ${consentItem.type}:`, error);
      }
    }

    return results;
  }

  /**
   * Get user consent status
   */
  async getUserConsent(userId: string, consentType?: ConsentType): Promise<ConsentRecord[]> {
    const userConsents = Array.from(this.consentRecords.values())
      .filter(record => record.userId === userId);

    if (consentType) {
      return userConsents.filter(record => record.consentType === consentType);
    }

    return userConsents;
  }

  /**
   * Check if user has valid consent for specific purpose
   */
  async hasValidConsent(
    userId: string,
    consentType: ConsentType,
    dataCategory?: DataCategory
  ): Promise<boolean> {
    const consents = await this.getUserConsent(userId, consentType);
    
    const validConsent = consents.find(consent => {
      // Check status
      if (consent.status !== ConsentStatus.GRANTED) return false;
      
      // Check expiration
      if (consent.expiresAt && consent.expiresAt < new Date()) return false;
      
      // Check data category if specified
      if (dataCategory && !consent.dataCategories.includes(dataCategory)) return false;
      
      return true;
    });

    return !!validConsent;
  }

  /**
   * Create retention policy
   */
  async createRetentionPolicy(policy: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<RetentionPolicy> {
    const fullPolicy: RetentionPolicy = {
      ...policy,
      id: this.generatePolicyId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.retentionPolicies.set(fullPolicy.id, fullPolicy);

    await auditLogger.logEvent(
      AuditEventType.CONFIGURATION_CHANGE,
      'retention_policy_created',
      {
        policyId: fullPolicy.id,
        dataCategory: policy.dataCategory,
        retentionPeriod: policy.retentionPeriod,
        details: {
          triggers: policy.triggers.length,
          exceptions: policy.exceptions.length,
          regulations: policy.regulations
        }
      }
    );

    return fullPolicy;
  }

  /**
   * Execute data retention for user
   */
  async executeDataRetention(userId: string): Promise<{
    deletedCategories: DataCategory[];
    anonymizedCategories: DataCategory[];
    archivedCategories: DataCategory[];
    errors: string[];
  }> {
    const result = {
      deletedCategories: [] as DataCategory[],
      anonymizedCategories: [] as DataCategory[],
      archivedCategories: [] as DataCategory[],
      errors: [] as string[]
    };

    try {
      const userConsents = await this.getUserConsent(userId);
      
      for (const policy of this.retentionPolicies.values()) {
        if (!policy.isActive) continue;

        const shouldExecute = await this.shouldExecuteRetention(userId, policy, userConsents);
        if (!shouldExecute) continue;

        for (const trigger of policy.triggers) {
          try {
            switch (trigger.action) {
              case 'delete':
                await this.deleteData(userId, policy.dataCategory);
                result.deletedCategories.push(policy.dataCategory);
                break;
                
              case 'anonymize':
                await this.anonymizeData(userId, policy.dataCategory);
                result.anonymizedCategories.push(policy.dataCategory);
                break;
                
              case 'archive':
                await this.archiveData(userId, policy.dataCategory);
                result.archivedCategories.push(policy.dataCategory);
                break;
                
              case 'review':
                await this.scheduleDataReview(userId, policy.dataCategory);
                break;
            }

            await auditLogger.logEvent(
              AuditEventType.PHI_DELETE,
              `data_${trigger.action}`,
              {
                userId,
                dataCategory: policy.dataCategory,
                policyId: policy.id,
                trigger: trigger.type,
                details: { condition: trigger.condition }
              }
            );

          } catch (error) {
            result.errors.push(
              `Failed to ${trigger.action} ${policy.dataCategory}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }

    } catch (error) {
      result.errors.push(`Retention execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Generate consent report for compliance
   */
  async generateConsentReport(userId: string): Promise<{
    totalConsents: number;
    activeConsents: number;
    withdrawnConsents: number;
    expiredConsents: number;
    consentsByType: Record<ConsentType, number>;
    complianceStatus: 'compliant' | 'partial' | 'non_compliant';
    recommendations: string[];
  }> {
    const userConsents = await this.getUserConsent(userId);
    
    const activeConsents = userConsents.filter(c => c.status === ConsentStatus.GRANTED).length;
    const withdrawnConsents = userConsents.filter(c => c.status === ConsentStatus.WITHDRAWN).length;
    const expiredConsents = userConsents.filter(c => 
      c.status === ConsentStatus.EXPIRED || 
      (c.expiresAt && c.expiresAt < new Date())
    ).length;

    const consentsByType = userConsents.reduce((acc, consent) => {
      acc[consent.consentType] = (acc[consent.consentType] || 0) + 1;
      return acc;
    }, {} as Record<ConsentType, number>);

    // Assess compliance status
    let complianceStatus: 'compliant' | 'partial' | 'non_compliant' = 'compliant';
    const recommendations: string[] = [];

    // Check for required consents
    const requiredConsents = [ConsentType.DATA_PROCESSING, ConsentType.TREATMENT];
    const missingRequired = requiredConsents.filter(type => 
      !userConsents.some(c => c.consentType === type && c.status === ConsentStatus.GRANTED)
    );

    if (missingRequired.length > 0) {
      complianceStatus = 'non_compliant';
      recommendations.push(`Missing required consents: ${missingRequired.join(', ')}`);
    }

    // Check for expired consents that should be renewed
    if (expiredConsents > 0) {
      complianceStatus = complianceStatus === 'compliant' ? 'partial' : complianceStatus;
      recommendations.push('Some consents have expired and should be renewed');
    }

    return {
      totalConsents: userConsents.length,
      activeConsents,
      withdrawnConsents,
      expiredConsents,
      consentsByType,
      complianceStatus,
      recommendations
    };
  }

  // Private helper methods

  private async denyConsent(
    consentId: string,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<ConsentRecord> {
    const record = this.consentRecords.get(consentId);
    if (!record) {
      throw new Error('Consent record not found');
    }

    record.status = ConsentStatus.DENIED;
    record.history.push({
      timestamp: new Date(),
      action: 'denied',
      ipAddress,
      userAgent
    });

    return record;
  }

  private initializeDefaultPolicies(): void {
    // GDPR retention policy
    const gdprPolicy: RetentionPolicy = {
      id: 'gdpr_default',
      name: 'GDPR Default Retention',
      dataCategory: DataCategory.PROFILE,
      retentionPeriod: 1095, // 3 years
      legalBasis: LegalBasis.CONSENT,
      triggers: [{
        type: 'consent_withdrawn',
        condition: 'consent_withdrawn',
        action: 'delete'
      }],
      exceptions: [{
        type: 'legal_hold',
        condition: 'ongoing_legal_case',
        extendedRetention: 365,
        justification: 'Legal proceedings require data retention'
      }],
      regulations: ['GDPR'],
      jurisdiction: 'EU',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    // HIPAA retention policy
    const hipaaPolicy: RetentionPolicy = {
      id: 'hipaa_medical',
      name: 'HIPAA Medical Records',
      dataCategory: DataCategory.MEDICAL,
      retentionPeriod: 2555, // 7 years
      legalBasis: LegalBasis.LEGAL_OBLIGATION,
      triggers: [{
        type: 'time_based',
        condition: 'retention_period_exceeded',
        action: 'archive'
      }],
      exceptions: [{
        type: 'active_treatment',
        condition: 'patient_under_care',
        extendedRetention: 365,
        justification: 'Ongoing patient care requires access to records'
      }],
      regulations: ['HIPAA'],
      jurisdiction: 'US',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.retentionPolicies.set(gdprPolicy.id, gdprPolicy);
    this.retentionPolicies.set(hipaaPolicy.id, hipaaPolicy);
  }

  private startRetentionScheduler(): void {
    // Run daily retention checks
    const dailyCheck = setInterval(async () => {
      await this.runScheduledRetention();
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.retentionJobs.push(dailyCheck);
  }

  private async runScheduledRetention(): Promise<void> {
    try {
      // Get all unique user IDs from consent records
      const userIds = Array.from(new Set(
        Array.from(this.consentRecords.values()).map(record => record.userId)
      ));

      for (const userId of userIds) {
        await this.executeDataRetention(userId);
      }

    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_SHUTDOWN,
        'retention_scheduler_error',
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          outcome: 'failure'
        }
      );
    }
  }

  private async shouldExecuteRetention(
    userId: string,
    policy: RetentionPolicy,
    userConsents: ConsentRecord[]
  ): Promise<boolean> {
    for (const trigger of policy.triggers) {
      switch (trigger.type) {
        case 'time_based':
          return this.checkTimeBased(policy);
          
        case 'consent_withdrawn':
          return this.checkConsentWithdrawn(userId, policy, userConsents);
          
        case 'account_deleted':
          return this.checkAccountDeleted(userId);
          
        case 'event_based':
          return this.checkEventBased(userId, trigger.condition);
      }
    }
    
    return false;
  }

  private checkTimeBased(policy: RetentionPolicy): boolean {
    if (policy.retentionPeriod <= 0) return false;
    
    const cutoffDate = new Date(Date.now() - policy.retentionPeriod * 24 * 60 * 60 * 1000);
    // In production, check actual data timestamps
    return true; // Simplified for demo
  }

  private checkConsentWithdrawn(userId: string, policy: RetentionPolicy, consents: ConsentRecord[]): boolean {
    return consents.some(consent => 
      consent.status === ConsentStatus.WITHDRAWN &&
      consent.dataCategories.includes(policy.dataCategory)
    );
  }

  private checkAccountDeleted(userId: string): boolean {
    // In production, check if user account is marked for deletion
    return false;
  }

  private checkEventBased(userId: string, condition: string): boolean {
    // In production, evaluate specific event conditions
    return false;
  }

  private async handleConsentWithdrawal(record: ConsentRecord): Promise<void> {
    // Trigger immediate data retention check for withdrawn consent
    await this.executeDataRetention(record.userId);
  }

  private async deleteData(userId: string, category: DataCategory): Promise<void> {
    // In production, delete actual data from databases
    console.log(`Deleting ${category} data for user ${userId}`);
  }

  private async anonymizeData(userId: string, category: DataCategory): Promise<void> {
    // In production, anonymize data in place
    console.log(`Anonymizing ${category} data for user ${userId}`);
  }

  private async archiveData(userId: string, category: DataCategory): Promise<void> {
    // In production, move data to archive storage
    console.log(`Archiving ${category} data for user ${userId}`);
  }

  private async scheduleDataReview(userId: string, category: DataCategory): Promise<void> {
    // In production, create review task for compliance team
    console.log(`Scheduling review for ${category} data for user ${userId}`);
  }

  private generateConsentText(type: ConsentType, purpose: string, categories: DataCategory[]): string {
    return `I consent to the processing of my ${categories.join(', ')} data for ${purpose}. This consent is for ${type} purposes and can be withdrawn at any time.`;
  }

  private getDefaultPurpose(type: ConsentType): string {
    const purposes = {
      [ConsentType.DATA_PROCESSING]: 'Essential service functionality',
      [ConsentType.TREATMENT]: 'Providing mental health treatment and care',
      [ConsentType.MARKETING]: 'Marketing communications and promotions',
      [ConsentType.ANALYTICS]: 'Service improvement and analytics',
      [ConsentType.RESEARCH]: 'Anonymous research and studies'
    };
    
    return purposes[type] || 'Data processing';
  }

  private getDefaultDataCategories(type: ConsentType): DataCategory[] {
    const categories = {
      [ConsentType.DATA_PROCESSING]: [DataCategory.PROFILE, DataCategory.USAGE],
      [ConsentType.TREATMENT]: [DataCategory.MEDICAL, DataCategory.THERAPEUTIC],
      [ConsentType.MARKETING]: [DataCategory.PROFILE, DataCategory.COMMUNICATION],
      [ConsentType.ANALYTICS]: [DataCategory.USAGE, DataCategory.BEHAVIORAL],
      [ConsentType.RESEARCH]: [DataCategory.THERAPEUTIC, DataCategory.BEHAVIORAL]
    };
    
    return categories[type] || [DataCategory.PROFILE];
  }

  private generateConsentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `consent_${timestamp}_${random}`;
  }

  private generatePolicyId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `policy_${timestamp}_${random}`;
  }
}

// Export singleton instance
export const consentService = ConsentService.getInstance();