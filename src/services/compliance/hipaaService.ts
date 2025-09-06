/**
 * HIPAA Compliance Service
 * Ensures compliance with HIPAA Privacy and Security Rules
 * Manages PHI (Protected Health Information) handling
 */

import { auditLogger, AuditEventType, AuditSeverity } from '../security/auditLogger';
import { cryptoService } from '../security/cryptoService';
import { fieldEncryption } from '../security/fieldEncryption';

// HIPAA-defined PHI categories
export enum PHICategory {
  // Identifiers
  NAME = 'name',
  ADDRESS = 'address',
  DATE_OF_BIRTH = 'date_of_birth',
  PHONE = 'phone',
  FAX = 'fax',
  EMAIL = 'email',
  SSN = 'ssn',
  MRN = 'medical_record_number',
  ACCOUNT_NUMBER = 'account_number',
  CERTIFICATE_NUMBER = 'certificate_number',
  VEHICLE_ID = 'vehicle_identifier',
  DEVICE_ID = 'device_identifier',
  WEB_URL = 'web_url',
  IP_ADDRESS = 'ip_address',
  BIOMETRIC = 'biometric_identifier',
  PHOTO = 'full_face_photo',
  
  // Health Information
  MEDICAL_HISTORY = 'medical_history',
  DIAGNOSIS = 'diagnosis',
  TREATMENT = 'treatment',
  MEDICATIONS = 'medications',
  ALLERGIES = 'allergies',
  LABORATORY_RESULTS = 'laboratory_results',
  CLINICAL_NOTES = 'clinical_notes',
  THERAPY_NOTES = 'therapy_notes',
  MENTAL_HEALTH_RECORDS = 'mental_health_records',
  
  // Financial
  PAYMENT_INFO = 'payment_information',
  INSURANCE = 'insurance_information'
}

// HIPAA access levels
export enum AccessLevel {
  NO_ACCESS = 'no_access',
  LIMITED = 'limited',          // Minimum necessary
  STANDARD = 'standard',        // Normal healthcare operations
  ADMINISTRATIVE = 'administrative', // Business operations
  EMERGENCY = 'emergency',      // Break-glass access
  AUDIT = 'audit'              // Audit and compliance review
}

// User roles with HIPAA permissions
export enum HIPAARole {
  PATIENT = 'patient',
  HEALTHCARE_PROVIDER = 'healthcare_provider',
  NURSE = 'nurse',
  THERAPIST = 'therapist',
  ADMINISTRATOR = 'administrator',
  BILLING = 'billing',
  IT_SUPPORT = 'it_support',
  AUDITOR = 'auditor',
  BUSINESS_ASSOCIATE = 'business_associate'
}

export interface PHIAccessRequest {
  userId: string;
  userRole: HIPAARole;
  patientId: string;
  phiCategories: PHICategory[];
  purpose: string;
  accessLevel: AccessLevel;
  timeLimit?: number; // in minutes
  justification: string;
  supervisorApproval?: boolean;
}

export interface PHIAccessGrant {
  id: string;
  request: PHIAccessRequest;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  conditions?: string[];
  accessLog: PHIAccessLogEntry[];
}

export interface PHIAccessLogEntry {
  timestamp: Date;
  action: string;
  phiAccessed: PHICategory[];
  outcome: 'success' | 'denied' | 'error';
  details?: Record<string, any>;
}

// HIPAA minimum necessary matrix
const ROLE_PHI_ACCESS_MATRIX: Record<HIPAARole, Record<PHICategory, AccessLevel>> = {
  [HIPAARole.PATIENT]: {
    [PHICategory.NAME]: AccessLevel.STANDARD,
    [PHICategory.DATE_OF_BIRTH]: AccessLevel.STANDARD,
    [PHICategory.MEDICAL_HISTORY]: AccessLevel.STANDARD,
    [PHICategory.DIAGNOSIS]: AccessLevel.STANDARD,
    [PHICategory.TREATMENT]: AccessLevel.STANDARD,
    [PHICategory.MEDICATIONS]: AccessLevel.STANDARD,
    [PHICategory.CLINICAL_NOTES]: AccessLevel.STANDARD,
    [PHICategory.THERAPY_NOTES]: AccessLevel.STANDARD,
    [PHICategory.MENTAL_HEALTH_RECORDS]: AccessLevel.STANDARD,
    [PHICategory.SSN]: AccessLevel.LIMITED,
    [PHICategory.INSURANCE]: AccessLevel.LIMITED,
    // Default no access to other categories
  } as any,
  
  [HIPAARole.HEALTHCARE_PROVIDER]: {
    [PHICategory.NAME]: AccessLevel.STANDARD,
    [PHICategory.DATE_OF_BIRTH]: AccessLevel.STANDARD,
    [PHICategory.MEDICAL_HISTORY]: AccessLevel.STANDARD,
    [PHICategory.DIAGNOSIS]: AccessLevel.STANDARD,
    [PHICategory.TREATMENT]: AccessLevel.STANDARD,
    [PHICategory.MEDICATIONS]: AccessLevel.STANDARD,
    [PHICategory.ALLERGIES]: AccessLevel.STANDARD,
    [PHICategory.LABORATORY_RESULTS]: AccessLevel.STANDARD,
    [PHICategory.CLINICAL_NOTES]: AccessLevel.STANDARD,
    [PHICategory.PHONE]: AccessLevel.LIMITED,
    [PHICategory.EMAIL]: AccessLevel.LIMITED,
    [PHICategory.ADDRESS]: AccessLevel.LIMITED,
  } as any,
  
  [HIPAARole.THERAPIST]: {
    [PHICategory.NAME]: AccessLevel.STANDARD,
    [PHICategory.DATE_OF_BIRTH]: AccessLevel.STANDARD,
    [PHICategory.MENTAL_HEALTH_RECORDS]: AccessLevel.STANDARD,
    [PHICategory.THERAPY_NOTES]: AccessLevel.STANDARD,
    [PHICategory.CLINICAL_NOTES]: AccessLevel.STANDARD,
    [PHICategory.DIAGNOSIS]: AccessLevel.STANDARD,
    [PHICategory.MEDICATIONS]: AccessLevel.LIMITED,
    [PHICategory.PHONE]: AccessLevel.LIMITED,
    [PHICategory.EMAIL]: AccessLevel.LIMITED,
  } as any,
  
  [HIPAARole.ADMINISTRATOR]: {
    [PHICategory.NAME]: AccessLevel.ADMINISTRATIVE,
    [PHICategory.ACCOUNT_NUMBER]: AccessLevel.ADMINISTRATIVE,
    [PHICategory.INSURANCE]: AccessLevel.ADMINISTRATIVE,
    [PHICategory.PAYMENT_INFO]: AccessLevel.ADMINISTRATIVE,
    // Limited access to clinical data
    [PHICategory.MEDICAL_HISTORY]: AccessLevel.LIMITED,
    [PHICategory.CLINICAL_NOTES]: AccessLevel.NO_ACCESS,
    [PHICategory.THERAPY_NOTES]: AccessLevel.NO_ACCESS,
  } as any,
  
  [HIPAARole.BILLING]: {
    [PHICategory.NAME]: AccessLevel.LIMITED,
    [PHICategory.DATE_OF_BIRTH]: AccessLevel.LIMITED,
    [PHICategory.INSURANCE]: AccessLevel.STANDARD,
    [PHICategory.PAYMENT_INFO]: AccessLevel.STANDARD,
    [PHICategory.ACCOUNT_NUMBER]: AccessLevel.STANDARD,
    [PHICategory.DIAGNOSIS]: AccessLevel.LIMITED, // For billing codes only
    // No access to detailed clinical data
    [PHICategory.CLINICAL_NOTES]: AccessLevel.NO_ACCESS,
    [PHICategory.THERAPY_NOTES]: AccessLevel.NO_ACCESS,
    [PHICategory.MENTAL_HEALTH_RECORDS]: AccessLevel.NO_ACCESS,
  } as any,
  
  [HIPAARole.AUDITOR]: {
    // Auditors have special access for compliance review
    [PHICategory.NAME]: AccessLevel.AUDIT,
    [PHICategory.MEDICAL_HISTORY]: AccessLevel.AUDIT,
    [PHICategory.CLINICAL_NOTES]: AccessLevel.AUDIT,
    [PHICategory.THERAPY_NOTES]: AccessLevel.AUDIT,
    [PHICategory.MENTAL_HEALTH_RECORDS]: AccessLevel.AUDIT,
  } as any,
  
  [HIPAARole.NURSE]: {
    [PHICategory.NAME]: AccessLevel.STANDARD,
    [PHICategory.DATE_OF_BIRTH]: AccessLevel.STANDARD,
    [PHICategory.MEDICAL_HISTORY]: AccessLevel.STANDARD,
    [PHICategory.CLINICAL_NOTES]: AccessLevel.LIMITED,
    [PHICategory.THERAPY_NOTES]: AccessLevel.NO_ACCESS,
    [PHICategory.MENTAL_HEALTH_RECORDS]: AccessLevel.NO_ACCESS,
  } as any,
  [HIPAARole.IT_SUPPORT]: {
    // IT support has very limited access for system maintenance
    [PHICategory.NAME]: AccessLevel.NO_ACCESS,
    [PHICategory.DATE_OF_BIRTH]: AccessLevel.NO_ACCESS,
    [PHICategory.MEDICAL_HISTORY]: AccessLevel.NO_ACCESS,
    [PHICategory.CLINICAL_NOTES]: AccessLevel.NO_ACCESS,
    [PHICategory.THERAPY_NOTES]: AccessLevel.NO_ACCESS,
    [PHICategory.MENTAL_HEALTH_RECORDS]: AccessLevel.NO_ACCESS,
  } as any,
  [HIPAARole.BUSINESS_ASSOCIATE]: {
    // Business associates have minimal required access
    [PHICategory.NAME]: AccessLevel.LIMITED,
    [PHICategory.DATE_OF_BIRTH]: AccessLevel.LIMITED,
    [PHICategory.MEDICAL_HISTORY]: AccessLevel.NO_ACCESS,
    [PHICategory.CLINICAL_NOTES]: AccessLevel.NO_ACCESS,
    [PHICategory.THERAPY_NOTES]: AccessLevel.NO_ACCESS,
    [PHICategory.MENTAL_HEALTH_RECORDS]: AccessLevel.NO_ACCESS,
  } as any
};

class HIPAAComplianceService {
  private static instance: HIPAAComplianceService;
  private activeAccessGrants: Map<string, PHIAccessGrant> = new Map();

  private constructor() {}

  static getInstance(): HIPAAComplianceService {
    if (!HIPAAComplianceService.instance) {
      HIPAAComplianceService.instance = new HIPAAComplianceService();
    }
    return HIPAAComplianceService.instance;
  }

  /**
   * Request access to PHI data
   */
  async requestPHIAccess(request: PHIAccessRequest): Promise<PHIAccessGrant | null> {
    try {
      // Validate request
      const validation = await this.validateAccessRequest(request);
      if (!validation.isValid) {
        await auditLogger.logEvent(
          AuditEventType.UNAUTHORIZED_ACCESS,
          'phi_access_denied',
          {
            userId: request.userId,
            patientId: request.patientId,
            reason: validation.reason,
            severity: AuditSeverity.HIGH,
            outcome: 'failure'
          }
        );
        return null;
      }

      // Apply minimum necessary principle
      const allowedCategories = await this.applyMinimumNecessary(request);

      // Create access grant
      const grant: PHIAccessGrant = {
        id: this.generateGrantId(),
        request: {
          ...request,
          phiCategories: allowedCategories
        },
        grantedBy: 'system', // In production, this would be the approving authority
        grantedAt: new Date(),
        expiresAt: request.timeLimit ? new Date(Date.now() + request.timeLimit * 60000) : undefined,
        conditions: await this.generateAccessConditions(request),
        accessLog: []
      };

      // Store active grant
      this.activeAccessGrants.set(grant.id, grant);

      // Log PHI access grant
      await auditLogger.logEvent(
        AuditEventType.PHI_ACCESS,
        'phi_access_granted',
        {
          userId: request.userId,
          patientId: request.patientId,
          phiAccessed: allowedCategories,
          accessLevel: request.accessLevel,
          purpose: request.purpose,
          grantId: grant.id,
          severity: AuditSeverity.HIGH,
          details: {
            userRole: request.userRole,
            justification: request.justification,
            timeLimit: request.timeLimit,
            conditions: grant.conditions
          }
        }
      );

      return grant;

    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.SECURITY_BREACH,
        'phi_access_error',
        {
          userId: request.userId,
          patientId: request.patientId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          severity: AuditSeverity.CRITICAL,
          outcome: 'failure'
        }
      );
      throw error;
    }
  }

  /**
   * Access PHI data with granted permission
   */
  async accessPHI(
    grantId: string,
    phiCategories: PHICategory[],
    action: string,
    context?: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const grant = this.activeAccessGrants.get(grantId);
      if (!grant) {
        await this.logUnauthorizedAccess('invalid_grant', { grantId, phiCategories });
        return { success: false, error: 'Invalid or expired access grant' };
      }

      // Check if grant has expired
      if (grant.expiresAt && grant.expiresAt < new Date()) {
        this.activeAccessGrants.delete(grantId);
        await this.logUnauthorizedAccess('expired_grant', { grantId, phiCategories });
        return { success: false, error: 'Access grant has expired' };
      }

      // Verify requested categories are within granted scope
      const unauthorizedCategories = phiCategories.filter(
        category => !grant.request.phiCategories.includes(category)
      );

      if (unauthorizedCategories.length > 0) {
        await this.logUnauthorizedAccess('scope_violation', {
          grantId,
          requestedCategories: phiCategories,
          grantedCategories: grant.request.phiCategories,
          unauthorizedCategories
        });
        return { success: false, error: 'Requested PHI categories exceed granted scope' };
      }

      // Log access
      const logEntry: PHIAccessLogEntry = {
        timestamp: new Date(),
        action,
        phiAccessed: phiCategories,
        outcome: 'success',
        details: context
      };

      grant.accessLog.push(logEntry);

      // Audit log
      await auditLogger.logPHIAccess(
        grant.request.patientId,
        phiCategories,
        {
          userId: grant.request.userId,
          grantId,
          action,
          details: context
        }
      );

      // In production, this would decrypt and return the actual PHI data
      return { success: true, data: `Accessed PHI: ${phiCategories.join(', ')}` };

    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.ENCRYPTION_FAILURE,
        'phi_access_error',
        {
          grantId,
          phiCategories,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          severity: AuditSeverity.CRITICAL,
          outcome: 'failure'
        }
      );

      return { success: false, error: 'PHI access failed' };
    }
  }

  /**
   * Revoke PHI access grant
   */
  async revokeAccess(grantId: string, reason: string): Promise<void> {
    const grant = this.activeAccessGrants.get(grantId);
    if (!grant) return;

    this.activeAccessGrants.delete(grantId);

    await auditLogger.logEvent(
      AuditEventType.PHI_ACCESS,
      'access_revoked',
      {
        userId: grant.request.userId,
        patientId: grant.request.patientId,
        grantId,
        reason,
        details: {
          grantDuration: Date.now() - grant.grantedAt.getTime(),
          accessCount: grant.accessLog.length
        }
      }
    );
  }

  /**
   * Get user's PHI access permissions for a role
   */
  getPHIPermissions(role: HIPAARole): Record<PHICategory, AccessLevel> {
    return ROLE_PHI_ACCESS_MATRIX[role] || {};
  }

  /**
   * Check if user has permission for specific PHI category
   */
  hasPermission(role: HIPAARole, phiCategory: PHICategory, requiredLevel: AccessLevel): boolean {
    const permissions = this.getPHIPermissions(role);
    const userLevel = permissions[phiCategory] || AccessLevel.NO_ACCESS;
    
    return this.isAccessLevelSufficient(userLevel, requiredLevel);
  }

  /**
   * Generate de-identification report
   */
  async generateDeidentificationReport(data: Record<string, any>): Promise<{
    originalFields: number;
    identifiedPHI: PHICategory[];
    deidentificationActions: string[];
    riskLevel: 'low' | 'medium' | 'high';
    compliant: boolean;
  }> {
    const identifiedPHI: PHICategory[] = [];
    const deidentificationActions: string[] = [];

    // Scan data for PHI
    for (const [field, value] of Object.entries(data)) {
      const phiCategory = this.identifyPHI(field, value);
      if (phiCategory) {
        identifiedPHI.push(phiCategory);
        deidentificationActions.push(`${field}: ${this.getDeidentificationAction(phiCategory)}`);
      }
    }

    const riskLevel = this.assessReidentificationRisk(identifiedPHI);
    const compliant = riskLevel === 'low';

    return {
      originalFields: Object.keys(data).length,
      identifiedPHI,
      deidentificationActions,
      riskLevel,
      compliant
    };
  }

  /**
   * De-identify data for research or secondary use
   */
  async deidentifyData(data: Record<string, any>): Promise<Record<string, any>> {
    const deidentified: Record<string, any> = {};

    for (const [field, value] of Object.entries(data)) {
      const phiCategory = this.identifyPHI(field, value);
      
      if (phiCategory) {
        deidentified[field] = await this.applyDeidentification(phiCategory, value);
      } else {
        deidentified[field] = value;
      }
    }

    await auditLogger.logEvent(
      AuditEventType.PHI_EXPORT,
      'data_deidentified',
      {
        details: {
          originalFields: Object.keys(data).length,
          deidentifiedFields: Object.keys(deidentified).length,
          deidentificationMethod: 'safe_harbor'
        }
      }
    );

    return deidentified;
  }

  // Private helper methods

  private async validateAccessRequest(request: PHIAccessRequest): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    // Check if user role is valid
    if (!Object.values(HIPAARole).includes(request.userRole)) {
      return { isValid: false, reason: 'Invalid user role' };
    }

    // Check if purpose is provided and reasonable
    if (!request.purpose || request.purpose.length < 10) {
      return { isValid: false, reason: 'Purpose must be specified and detailed' };
    }

    // Check if justification is provided for sensitive access
    if (request.accessLevel === AccessLevel.EMERGENCY && !request.supervisorApproval) {
      return { isValid: false, reason: 'Emergency access requires supervisor approval' };
    }

    // Validate PHI categories against role permissions
    const permissions = this.getPHIPermissions(request.userRole);
    const unauthorizedCategories = request.phiCategories.filter(
      category => !permissions[category] || permissions[category] === AccessLevel.NO_ACCESS
    );

    if (unauthorizedCategories.length > 0) {
      return {
        isValid: false,
        reason: `User role ${request.userRole} not authorized for: ${unauthorizedCategories.join(', ')}`
      };
    }

    return { isValid: true };
  }

  private async applyMinimumNecessary(request: PHIAccessRequest): Promise<PHICategory[]> {
    const permissions = this.getPHIPermissions(request.userRole);
    
    return request.phiCategories.filter(category => {
      const accessLevel = permissions[category];
      return accessLevel && accessLevel !== AccessLevel.NO_ACCESS;
    });
  }

  private async generateAccessConditions(request: PHIAccessRequest): Promise<string[]> {
    const conditions: string[] = [];

    conditions.push('Access limited to minimum necessary for stated purpose');
    conditions.push('All access must be logged and auditable');
    
    if (request.timeLimit) {
      conditions.push(`Access expires after ${request.timeLimit} minutes`);
    }

    if (request.accessLevel === AccessLevel.EMERGENCY) {
      conditions.push('Emergency access - requires post-access review');
    }

    return conditions;
  }

  private identifyPHI(fieldName: string, value: any): PHICategory | null {
    const field = fieldName.toLowerCase();

    // Field name patterns
    if (field.includes('name')) return PHICategory.NAME;
    if (field.includes('email')) return PHICategory.EMAIL;
    if (field.includes('phone')) return PHICategory.PHONE;
    if (field.includes('ssn') || field.includes('social')) return PHICategory.SSN;
    if (field.includes('address')) return PHICategory.ADDRESS;
    if (field.includes('birth') || field.includes('dob')) return PHICategory.DATE_OF_BIRTH;
    if (field.includes('diagnosis')) return PHICategory.DIAGNOSIS;
    if (field.includes('treatment')) return PHICategory.TREATMENT;
    if (field.includes('medication')) return PHICategory.MEDICATIONS;
    if (field.includes('therapy')) return PHICategory.THERAPY_NOTES;
    if (field.includes('clinical')) return PHICategory.CLINICAL_NOTES;

    // Value pattern analysis (simplified)
    if (typeof value === 'string') {
      // Email pattern
      if (value.includes('@')) return PHICategory.EMAIL;
      // Phone pattern
      if (/^\d{3}-?\d{3}-?\d{4}$/.test(value)) return PHICategory.PHONE;
      // SSN pattern
      if (/^\d{3}-?\d{2}-?\d{4}$/.test(value)) return PHICategory.SSN;
    }

    return null;
  }

  private getDeidentificationAction(category: PHICategory): string {
    const actions: Record<PHICategory, string> = {
      [PHICategory.NAME]: 'Replace with identifier code',
      [PHICategory.EMAIL]: 'Remove or hash',
      [PHICategory.PHONE]: 'Remove or truncate',
      [PHICategory.ADDRESS]: 'Remove or generalize to state level',
      [PHICategory.DATE_OF_BIRTH]: 'Generalize to year or age range',
      [PHICategory.SSN]: 'Remove completely',
      [PHICategory.IP_ADDRESS]: 'Remove or hash',
      [PHICategory.PHOTO]: 'Remove facial features',
      [PHICategory.CLINICAL_NOTES]: 'Remove identifying details',
      [PHICategory.THERAPY_NOTES]: 'Remove identifying details',
      // Add more as needed
    } as any;

    return actions[category] || 'Review and redact as necessary';
  }

  private async applyDeidentification(category: PHICategory, value: any): Promise<any> {
    switch (category) {
      case PHICategory.NAME:
        return `PATIENT_${await cryptoService.hash(String(value)).then(h => h.slice(0, 8))}`;
      case PHICategory.EMAIL:
        return '[EMAIL_REMOVED]';
      case PHICategory.PHONE:
        return '[PHONE_REMOVED]';
      case PHICategory.SSN:
        return '[SSN_REMOVED]';
      case PHICategory.ADDRESS:
        return '[ADDRESS_REMOVED]';
      case PHICategory.DATE_OF_BIRTH:
        // Generalize to year only
        if (value instanceof Date) {
          return `${value.getFullYear()}-01-01`;
        }
        return '[DATE_GENERALIZED]';
      default:
        return '[REDACTED]';
    }
  }

  private assessReidentificationRisk(phiCategories: PHICategory[]): 'low' | 'medium' | 'high' {
    const highRiskCategories = [PHICategory.NAME, PHICategory.SSN, PHICategory.EMAIL, PHICategory.PHOTO];
    const mediumRiskCategories = [PHICategory.PHONE, PHICategory.ADDRESS, PHICategory.DATE_OF_BIRTH];

    const highRiskCount = phiCategories.filter(cat => highRiskCategories.includes(cat)).length;
    const mediumRiskCount = phiCategories.filter(cat => mediumRiskCategories.includes(cat)).length;

    if (highRiskCount > 0) return 'high';
    if (mediumRiskCount > 2) return 'high';
    if (mediumRiskCount > 0) return 'medium';
    return 'low';
  }

  private isAccessLevelSufficient(userLevel: AccessLevel, requiredLevel: AccessLevel): boolean {
    const levelHierarchy = {
      [AccessLevel.NO_ACCESS]: 0,
      [AccessLevel.LIMITED]: 1,
      [AccessLevel.STANDARD]: 2,
      [AccessLevel.ADMINISTRATIVE]: 2,
      [AccessLevel.EMERGENCY]: 3,
      [AccessLevel.AUDIT]: 3
    };

    return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
  }

  private async logUnauthorizedAccess(reason: string, details: Record<string, any>): Promise<void> {
    await auditLogger.logEvent(
      AuditEventType.UNAUTHORIZED_ACCESS,
      'phi_access_denied',
      {
        reason,
        details,
        severity: AuditSeverity.HIGH,
        outcome: 'failure'
      }
    );
  }

  private generateGrantId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `grant_${timestamp}_${random}`;
  }
}

// Export singleton instance
export const hipaaService = HIPAAComplianceService.getInstance();